from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden, HttpResponseNotAllowed, HttpResponseNotFound
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from .models import Post, Tag
from django.utils.text import slugify
import json


def authorized(request):
    """Проверка ключа авторизации для POST и DELETE запросов"""
    key = request.headers.get("X-API-KEY") or request.GET.get("api_key")
    return key == getattr(settings, "API_SHARED_KEY", None)


@method_decorator(csrf_exempt, name="dispatch")
class PostListCreateView(View):
    """
    GET  /api/posts/?page=1&tag=slug — список постов
    POST /api/posts/ — создание поста (для бота)
    """

    def get(self, request):
        qs = Post.objects.all().select_related().prefetch_related("tags")
        tag = request.GET.get("tag")
        if tag:
            qs = qs.filter(tags__slug=tag)

        # простая пагинация
        page = int(request.GET.get("page", 1))
        page_size = 10
        start, end = (page - 1) * page_size, page * page_size
        results = [
            {
                "title": p.title,
                "slug": p.slug,
                "cover": p.cover.url if p.cover else None,
                "tags": list(p.tags.values_list("slug", flat=True)),
                "created_at": p.created_at.isoformat(),
            }
            for p in qs[start:end]
        ]
        return JsonResponse({"count": qs.count(), "results": results}, status=200)

    def post(self, request):
        if not authorized(request):
            return HttpResponseForbidden("Invalid API key")

        print("🟢 POST /api/posts/ получен")
        print("📥 request.POST:", request.POST)
        print("📦 request.FILES:", request.FILES)

        # Пробуем прочитать JSON, если данные не пришли как форма
        if not request.POST and request.body:
            try:
                data = json.loads(request.body.decode("utf-8"))
            except Exception:
                data = {}
        else:
            data = request.POST

        title = data.get("title", "(без названия)")
        body = data.get("body", "")
        tag_slugs = data.getlist("tag_slugs") if hasattr(data, "getlist") else data.get("tag_slugs", [])

        # Приводим теги к списку
        if isinstance(tag_slugs, str):
            tag_slugs = [tag_slugs]
        tag_slugs = [t.strip().lower() for t in tag_slugs if t.strip()]

        print(f"🏷 Полученные теги: {tag_slugs}")

        post = Post.objects.create(title=title, body=body, published=True)
        # добавляем теги
        if tag_slugs:
            from unidecode import unidecode  # 👈 добавляем импорт для латинизации
            tags = []
            for raw in tag_slugs:
                raw_clean = raw.strip()
                if not raw_clean:
                    continue
                # преобразуем кириллицу → латиницу
                latin_slug = slugify(unidecode(raw_clean))[:60]
                tag, _ = Tag.objects.get_or_create(
                    slug=latin_slug,
                    defaults={"name": raw_clean.title()}
                )
                tags.append(tag)
            post.tags.set(tags)
            print(f"✅ Установлены теги: {[t.slug for t in tags]}")
        else:
            print("⚠️ Теги отсутствуют — пропущено")

        # добавляем обложку
        if "cover" in request.FILES:
            post.cover = request.FILES["cover"]
            post.save()
            print(f"🖼 Добавлено изображение: {post.cover.name}")

        return JsonResponse(
            {
                "slug": post.slug,
                "tags": list(post.tags.values_list("slug", flat=True)),
            },
            status=201,
        )

    def http_method_not_allowed(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(["GET", "POST"])


@method_decorator(csrf_exempt, name="dispatch")
class PostRetrieveDeleteView(View):
    """
    GET    /api/posts/<slug>/ — получить пост
    DELETE /api/posts/<slug>/ — удалить (через бота)
    """

    def get(self, request, slug):
        try:
            p = Post.objects.get(slug=slug)
        except Post.DoesNotExist:
            return HttpResponseNotFound("Not found")

        data = {
            "title": p.title,
            "slug": p.slug,
            "body": p.body,
            "cover": p.cover.url if p.cover else None,
            "tags": list(p.tags.values_list("slug", flat=True)),
            "created_at": p.created_at.isoformat(),
        }
        return JsonResponse(data, status=200)

    def delete(self, request, slug):
        if not authorized(request):
            return HttpResponseForbidden("Invalid API key")

        try:
            p = Post.objects.get(slug=slug)
        except Post.DoesNotExist:
            return HttpResponseNotFound("Not found")

        print(f"🗑 Удаляем пост {slug}")
        if p.cover:
            print(f"🧹 Удаляем обложку: {p.cover.name}")
            p.cover.delete(save=False)

        p.delete()
        return JsonResponse({"deleted": slug}, status=200)

    def http_method_not_allowed(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(["GET", "DELETE"])


@method_decorator(csrf_exempt, name="dispatch")
class TagListView(View):
    """GET /api/tags/ — список тегов"""

    def get(self, request):
        tags = list(Tag.objects.all().values("name", "slug"))
        return JsonResponse({"count": len(tags), "results": tags}, status=200)

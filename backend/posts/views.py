from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden, HttpResponseNotAllowed, HttpResponseNotFound
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from .models import Post, Tag

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

        title = request.POST.get("title", "(без названия)")
        body = request.POST.get("body", "")
        tag_slugs = request.POST.getlist("tag_slugs", [])

        post = Post.objects.create(title=title, body=body, published=True)

        # добавляем теги
        if tag_slugs:
            tags = Tag.objects.filter(slug__in=tag_slugs)
            post.tags.set(tags)

        # добавляем обложку
        if "cover" in request.FILES:
            post.cover = request.FILES["cover"]
            post.save()

        return JsonResponse({"slug": post.slug}, status=201)

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

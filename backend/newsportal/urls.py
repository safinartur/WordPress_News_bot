from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def healthcheck(request):
    """Простой health-check для Render и бота"""
    return JsonResponse({"status": "ok"}, status=200)


urlpatterns = [
    path("", healthcheck),  # ✅ теперь / вернёт 200 OK
    path("admin/", admin.site.urls),
    path("api/", include("posts.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

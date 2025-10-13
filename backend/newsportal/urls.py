from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def healthcheck(request):
    """Простой health-check для Render, uptime-мониторов и Telegram-бота"""
    return JsonResponse(
        {
            "status": "ok",
            "app": "newsportal",
            "debug": settings.DEBUG,
        },
        status=200,
    )


urlpatterns = [
    # 🌐 healthcheck — нужен Render и боту для “пробуждения”
    path("", healthcheck, name="healthcheck"),

    # 🧭 основное API
    path("api/", include("posts.api_urls")),

    # ⚙️ админка
    path("admin/", admin.site.urls),
]

# 🖼️ отдача медиа и статики в DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

from django.urls import path
from . import api_views

urlpatterns = [
    # 📜 Получить список постов или создать новый
    path("posts/", api_views.PostListCreateView.as_view(), name="post-list-create"),

    # 🔍 Получить один пост или удалить
    path("posts/<slug:slug>/", api_views.PostRetrieveDeleteView.as_view(), name="post-detail-delete"),

    # 🏷 Получить список тегов
    path("tags/", api_views.TagListView.as_view(), name="tag-list"),
]

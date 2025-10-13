from rest_framework import serializers
from django.utils.text import slugify
from .models import Post, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]


class PostSerializer(serializers.ModelSerializer):
    # Теги для чтения (возвращаются на фронтенд)
    tags = TagSerializer(many=True, read_only=True)

    # Теги для записи (принимаются от бота как список slug’ов)
    tag_slugs = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="Список тегов (slug) для привязки к посту",
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "body",
            "created_at",
            "published",
            "cover",
            "tags",
            "tag_slugs",
            "source_url",
        ]

    def create(self, validated_data):
        """
        При создании поста принимает список slug-тегов.
        Если тег отсутствует — создаёт автоматически.
        """
        tag_slugs = validated_data.pop("tag_slugs", [])
        post = Post.objects.create(**validated_data)

        if tag_slugs:
            tags = []
            for raw in tag_slugs:
                raw = raw.strip()
                if not raw:
                    continue
                # генерируем slug корректно
                slug = slugify(raw)[:60]
                name = raw.replace("-", " ").title()
                tag, _ = Tag.objects.get_or_create(slug=slug, defaults={"name": name})
                tags.append(tag)
            post.tags.set(tags)

        return post

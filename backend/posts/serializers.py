from rest_framework import serializers
from .models import Post, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]


class PostSerializer(serializers.ModelSerializer):
    # Чтение — отдаём красиво оформленные теги
    tags = TagSerializer(many=True, read_only=True)
    # Запись — принимаем массив slug'ов от бота
    tag_slugs = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
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
        tag_slugs = validated_data.pop("tag_slugs", [])
        post = Post.objects.create(**validated_data)

        if tag_slugs:
            tags = []
            for slug in tag_slugs:
                slug = (slug or "").strip().lower()
                if not slug:
                    continue
                tag, _ = Tag.objects.get_or_create(
                    slug=slug,
                    defaults={"name": slug.replace("-", " ").title()},
                )
                tags.append(tag)
            post.tags.set(tags)

        return post

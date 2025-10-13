import io
import json
from datetime import datetime
from django.db import models
from django.utils.text import slugify
from django.core.files.storage import default_storage


class Tag(models.Model):
    name = models.CharField(max_length=64, unique=True)
    slug = models.SlugField(max_length=80, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Post(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    published = models.BooleanField(default=True)
    cover = models.ImageField(upload_to="covers/", blank=True, null=True)
    tags = models.ManyToManyField(Tag, related_name="posts", blank=True)
    source_url = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        """
        Сохраняет пост с уникальным slug и делает JSON-бэкап в S3 / локально.
        """
        if not self.slug:
            base = slugify(self.title)[:60] or "post"
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            slug = f"{base}-{timestamp}"

            # если slug уже существует — добавляем счётчик
            counter = 1
            while Post.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f"{base}-{timestamp}-{counter}"

            self.slug = slug

        super().save(*args, **kwargs)

        # --- JSON-бэкап ---
        try:
            data = {
                "title": self.title,
                "slug": self.slug,
                "body": self.body,
                "created_at": self.created_at.isoformat(),
                "published": self.published,
                "tags": list(self.tags.values_list("slug", flat=True)),
                "cover": self.cover.url if self.cover else None,
                "source_url": self.source_url,
            }

            buffer = io.BytesIO(json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"))
            path = f"posts/{self.slug}.json"
            # перезапишет, если уже существует (благодаря FILE_OVERWRITE=False)
            default_storage.save(path, buffer)
        except Exception as e:
            print(f"⚠️ Не удалось сделать JSON-бэкап: {e}")

    def delete(self, *args, **kwargs):
        """
        Удаляет JSON-бэкап при удалении поста.
        """
        try:
            path = f"posts/{self.slug}.json"
            if default_storage.exists(path):
                default_storage.delete(path)
        except Exception as e:
            print(f"⚠️ Не удалось удалить JSON-бэкап: {e}")

        super().delete(*args, **kwargs)

    def __str__(self):
        return self.title

import io
import json
from datetime import datetime
from django.db import models
from django.utils.text import slugify
from django.core.files.storage import default_storage


def _delete_all_post_backups(slug: str):
    """
    Удаляет ВСЕ файлы бэкапов по маске posts/<slug>.json*
    (нужно, т.к. при AWS_S3_FILE_OVERWRITE=False django-storages
    добавляет автосуффикс при совпадении имён).
    """
    try:
        dirs, files = default_storage.listdir("posts")
        prefix = f"{slug}.json"
        for name in files:
            if name.startswith(prefix):
                default_storage.delete(f"posts/{name}")
    except Exception as e:
        print(f"⚠️ Не удалось перечислить/удалить бэкапы для {slug}: {e}")


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
        Сохраняет пост с уникальным slug и обновляет JSON-бэкап в S3/локально.
        Перед записью удаляет все предыдущие версии бэкапа для этого slug.
        """
        if not self.slug:
            base = slugify(self.title)[:60] or "post"
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            slug = f"{base}-{timestamp}"
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

            # удаляем любые старые файлы бэкапов для текущего slug
            _delete_all_post_backups(self.slug)

            buf = io.BytesIO(json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"))
            # теперь имя будет детерминированным
            default_storage.save(f"posts/{self.slug}.json", buf)
        except Exception as e:
            print(f"⚠️ Не удалось обновить JSON-бэкап: {e}")

    def delete(self, *args, **kwargs):
        """
        Удаляет все варианты JSON-бэкапа и файл обложки в S3/локально.
        """
        # JSON-бэкапы
        _delete_all_post_backups(self.slug)

        # Обложка
        try:
            if self.cover and self.cover.name and default_storage.exists(self.cover.name):
                default_storage.delete(self.cover.name)
        except Exception as e:
            print(f"⚠️ Не удалось удалить обложку: {e}")

        super().delete(*args, **kwargs)

    def __str__(self):
        return self.title

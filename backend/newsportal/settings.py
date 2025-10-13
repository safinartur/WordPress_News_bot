from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url

# === BASE ===
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# === SECURITY ===
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.getenv("DEBUG", "1") == "1"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

# === INSTALLED APPS ===
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "storages",      # ✅ для S3/R2
    "posts",         # твоё приложение
]

# === MIDDLEWARE ===
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# === ROOT ===
ROOT_URLCONF = "newsportal.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "newsportal.wsgi.application"

# === DATABASE ===
# Используем PostgreSQL, если указан DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    print("🗄 Using PostgreSQL database from DATABASE_URL")
    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    print("💾 Using local SQLite database")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# === PASSWORD VALIDATORS ===
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# === INTERNATIONALIZATION ===
LANGUAGE_CODE = "ru-ru"
TIME_ZONE = "Europe/Moscow"
USE_I18N = True
USE_TZ = True

# === STATIC & MEDIA ===
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# === AWS / CLOUDFLARE R2 STORAGE ===
USE_S3 = os.getenv("USE_S3", "1") == "1" or not DEBUG
if USE_S3:
    print("📦 Using S3/R2 for media storage")
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"

    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", None)
    AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL")
    AWS_S3_SIGNATURE_VERSION = "s3v4"
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_ADDRESSING_STYLE = "path"

    AWS_S3_OBJECT_PARAMETERS = {
        "ACL": "public-read",
        "CacheControl": "max-age=86400",
    }

    AWS_S3_CUSTOM_DOMAIN = os.getenv(
        "AWS_S3_CUSTOM_DOMAIN",
        "pub-bfd49b4c4d6a45f5a53468e36adc461b.r2.dev",  # Cloudflare R2 example
    )

    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/"
else:
    print("💾 Using local FileSystemStorage for media")

# === REST FRAMEWORK + CORS ===
CORS_ALLOW_ALL_ORIGINS = True

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

# === SHARED API KEY (for Telegram bot, etc.) ===
API_SHARED_KEY = os.getenv("API_SHARED_KEY", "change-this-api-key")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

import os
import sys
import time
import json
import asyncio
import fcntl
import requests
from dotenv import load_dotenv
from typing import Optional
from telegram import (
    Update,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes,
)
from telegram.error import Conflict, NetworkError, TimedOut
import boto3

# === Загрузка переменных окружения ===
load_dotenv()

# === Защита от двойного запуска ===
lock_file = "/tmp/bot.lock"
try:
    lock_fd = open(lock_file, "w")
    fcntl.lockf(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
except IOError:
    print("🚫 Другой экземпляр бота уже запущен. Завершение.")
    sys.exit(0)

# === Конфигурация ===
API_BASE = os.getenv("BACKEND_API_BASE", "http://127.0.0.1:8000/api")
API_KEY = os.getenv("API_SHARED_KEY")
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
DEFAULT_TAGS = [t.strip() for t in os.getenv("DEFAULT_TAGS", "").split(",") if t.strip()]
OWNER_ID = int(os.getenv("OWNER_ID", "0"))

# === Настройки S3/R2 ===
S3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("S3_ENDPOINT"),
    aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
)
S3_BUCKET = os.getenv("S3_BUCKET")
MOD_FILE_KEY = "config/moderators.json"

# === Локальный кэш модераторов ===
_cached_mods = set()

def load_moderators():
    """Загружаем список модераторов из R2"""
    global _cached_mods
    try:
        obj = S3.get_object(Bucket=S3_BUCKET, Key=MOD_FILE_KEY)
        data = json.loads(obj["Body"].read().decode())
        _cached_mods = set(data)
        print(f"✅ Модераторы загружены: {_cached_mods}")
    except S3.exceptions.NoSuchKey:
        _cached_mods = set()
        print("⚠️ Файл модераторов не найден — создан новый.")
    except Exception as e:
        print(f"⚠️ Ошибка загрузки модераторов: {e}")
        _cached_mods = set()
    return _cached_mods

def save_moderators():
    """Сохраняем список модераторов в R2"""
    try:
        data = json.dumps(list(_cached_mods), indent=2).encode()
        S3.put_object(
            Bucket=S3_BUCKET,
            Key=MOD_FILE_KEY,
            Body=data,
            ContentType="application/json",
        )
        print("💾 Список модераторов сохранён.")
    except Exception as e:
        print(f"⚠️ Ошибка сохранения модераторов: {e}")

# === Авторизация ===
def is_authorized(user_id: int) -> bool:
    return user_id == OWNER_ID or user_id in _cached_mods

# === Константы ===
TITLE, BODY, TAGS, IMAGE = range(4)

MAIN_TAGS = [
    ("новости", "📰 Новости"),
    ("общество", "🏙 Общество"),
    ("политика", "🏛 Политика"),
    ("экономика", "💰 Экономика"),
    ("транспорт", "🚗 Транспорт"),
    ("экология", "🌿 Экология"),
]

HELP_MESSAGE = """
📰 *Справка по работе бота*

Этот бот публикует новости на сайт **Padua.News**.

📌 *Команды:*
- `/new` — начать публикацию новости  
- `/help` — справка  
- `/cancel` — отменить публикацию  
- `/delete <slug>` — удалить новость  
- `/status` — проверить backend  

🧩 *Админ-команды (только владелец):*
- `/add_moderator <tg_id>` — добавить модератора  
- `/list_moderators` — показать всех модераторов  

🚀 *Инструкция:*
1️⃣ Введите `/new`  
2️⃣ Введите заголовок  
3️⃣ Напишите текст новости (можно с Markdown)  
4️⃣ Прикрепите фото или введите `/skip`  
5️⃣ Выберите теги и подтвердите публикацию  
"""

# === Команды ===
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(HELP_MESSAGE, parse_mode="Markdown")

async def add_moderator(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id != OWNER_ID:
        await update.message.reply_text("🚫 Только владелец может добавлять модераторов.")
        return

    if not context.args:
        await update.message.reply_text("❗ Использование: /add_moderator <telegram_id>")
        return

    try:
        new_mod = int(context.args[0])
    except ValueError:
        await update.message.reply_text("⚠️ ID должен быть числом.")
        return

    if new_mod in _cached_mods:
        await update.message.reply_text("✅ Этот пользователь уже модератор.")
        return

    _cached_mods.add(new_mod)
    save_moderators()
    await update.message.reply_text(f"✅ Пользователь {new_mod} добавлен как модератор.")

async def list_moderators(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        await update.message.reply_text("🚫 Только владелец может просматривать модераторов.")
        return
    if not _cached_mods:
        await update.message.reply_text("📭 Список модераторов пуст.")
        return
    text = "👥 *Список модераторов:*\n" + "\n".join([f"- `{m}`" for m in sorted(_cached_mods)])
    await update.message.reply_text(text, parse_mode="Markdown")

# === Извлечение slug ===
def extract_slug(text: str) -> str:
    text = text.strip()
    if "#/post/" in text:
        return text.split("#/post/")[-1].split("?")[0].split("#")[0].strip("/")
    if "/post/" in text:
        return text.split("/post/")[-1].split("?")[0].split("#")[0].strip("/")
    return text

# === /new ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id):
        await update.message.reply_text("⛔ Доступ только для модераторов.")
        return ConversationHandler.END
    await update.message.reply_text("👋 Отправьте заголовок новости.")
    return TITLE

async def got_title(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["title"] = update.message.text.strip()
    await update.message.reply_text("📝 Теперь пришлите текст новости (Markdown разрешён).")
    return BODY

async def got_body(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["body"] = update.message.text or update.message.caption or ""
    buttons = [[InlineKeyboardButton(label, callback_data=slug)] for slug, label in MAIN_TAGS]
    buttons.append([InlineKeyboardButton("✅ Продолжить", callback_data="done")])
    await update.message.reply_text("🏷 Выберите теги:", reply_markup=InlineKeyboardMarkup(buttons))
    context.user_data["tag_slugs"] = []
    return TAGS

async def select_tag(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    tag = query.data
    await query.answer()
    if tag == "done":
        if not context.user_data.get("tag_slugs"):
            context.user_data["tag_slugs"] = DEFAULT_TAGS
        await query.edit_message_text("📷 Пришлите изображение или /skip чтобы пропустить.")
        return IMAGE
    tags = context.user_data.get("tag_slugs", [])
    if tag not in tags:
        tags.append(tag)
    context.user_data["tag_slugs"] = tags
    selected = ", ".join(tags) or "нет"
    buttons = [[InlineKeyboardButton(label, callback_data=slug)] for slug, label in MAIN_TAGS]
    buttons.append([InlineKeyboardButton("✅ Продолжить", callback_data="done")])
    await query.edit_message_text(
        f"✅ Вы выбрали: {selected}\n\nМожно добавить ещё или нажать ✅ Продолжить.",
        reply_markup=InlineKeyboardMarkup(buttons),
    )
    return TAGS

async def skip_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await publish(update, context, photo_file=None)
    return ConversationHandler.END

async def got_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    photo = update.message.photo[-1]
    file = await photo.get_file()
    photo_path = await file.download_to_drive(custom_path="upload.jpg")
    await publish(update, context, photo_file=str(photo_path))
    try:
        os.remove(str(photo_path))
    except Exception:
        pass
    return ConversationHandler.END

# === Публикация ===
async def publish(update: Update, context: ContextTypes.DEFAULT_TYPE, photo_file: Optional[str]):
    print("📤 Публикация новости...")
    try:
        data = {
            "title": context.user_data.get("title", "(без названия)"),
            "body": context.user_data.get("body", "(без текста)"),
            "tag_slugs": context.user_data.get("tag_slugs", DEFAULT_TAGS),
        }
        files = {"cover": open(photo_file, "rb")} if photo_file else None
        headers = {"X-API-KEY": API_KEY}
        r = requests.post(f"{API_BASE}/posts/", data=data, files=files, headers=headers, timeout=(10, 30))
        if files:
            files["cover"].close()
        if r.ok:
            post = r.json()
            FRONTEND_BASE = os.getenv("FRONTEND_BASE", API_BASE.replace("/api", ""))
            url = f"{FRONTEND_BASE}/#/post/{post['slug']}"
            await update.message.reply_text(f"✅ Опубликовано успешно:\n{url}")
        else:
            await update.message.reply_text(f"❌ Ошибка публикации ({r.status_code}): {r.text[:300]}")
    except Exception as e:
        await update.message.reply_text(f"💥 Ошибка публикации: {e}")

# === /delete ===
async def delete_post(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id):
        await update.message.reply_text("🚫 Доступ только для модераторов.")
        return
    text = update.message.text.strip().split(maxsplit=1)
    if len(text) < 2:
        await update.message.reply_text("ℹ️ Использование: /delete <slug или ссылка>")
        return
    slug = extract_slug(text[1])
    delete_url = f"{API_BASE}/posts/{slug}/"
    headers = {"X-API-KEY": API_KEY}
    resp = requests.delete(delete_url, headers=headers, timeout=10)
    if resp.status_code == 200:
        await update.message.reply_text(f"✅ Пост `{slug}` удалён.", parse_mode="Markdown")
    else:
        await update.message.reply_text(f"⚠️ Ошибка удаления ({resp.status_code}).")

# === /status ===
async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        r = requests.get(f"{API_BASE}/posts/?page=1", timeout=8)
        await update.message.reply_text("✅ Backend доступен." if r.ok else "⚠️ Backend ответил с ошибкой.")
    except Exception as e:
        await update.message.reply_text(f"🟥 Backend недоступен: {e}")

# === /cancel ===
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Отмена операции.")
    return ConversationHandler.END

# === Инициализация ===
def build_app():
    app = Application.builder().token(TOKEN).build()
    conv_new = ConversationHandler(
        entry_points=[CommandHandler("new", start)],
        states={
            TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_title)],
            BODY: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_body)],
            TAGS: [CallbackQueryHandler(select_tag)],
            IMAGE: [CommandHandler("skip", skip_image), MessageHandler(filters.PHOTO, got_image)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        per_chat=True,
        per_message=False,
    )
    app.add_handler(conv_new)
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("add_moderator", add_moderator))
    app.add_handler(CommandHandler("list_moderators", list_moderators))
    app.add_handler(CommandHandler("delete", delete_post))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("cancel", cancel))
    return app

# === Основной цикл ===
if __name__ == "__main__":
    load_moderators()
    print("🤖 Запуск Telegram-бота...")
    while True:
        try:
            app = build_app()
            app.run_polling()
        except Conflict:
            print("⚠️ Conflict: другой бот уже запущен. Жду 30 секунд...")
            time.sleep(30)
        except (NetworkError, TimedOut) as e:
            print(f"🌐 NetworkError: {e}. Повтор через 15 секунд...")
            time.sleep(15)
        except Exception as e:
            print(f"💥 Ошибка: {e}. Перезапуск через 60 секунд...")
            time.sleep(60)

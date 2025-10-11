import os
import time
import asyncio
import requests
from dotenv import load_dotenv
from typing import Optional

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    filters,
    ContextTypes,
)
from telegram.error import Conflict, NetworkError, TimedOut

# === Загрузка переменных окружения ===
load_dotenv()

API_BASE = os.getenv("BACKEND_API_BASE", "http://127.0.0.1:8000/api")
API_KEY = os.getenv("API_SHARED_KEY")
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
MOD_IDS = {int(x) for x in os.getenv("MODERATOR_IDS", "").split(",") if x.strip().isdigit()}
DEFAULT_TAGS = [t.strip() for t in os.getenv("DEFAULT_TAGS", "").split(",") if t.strip()]

TITLE, BODY, IMAGE = range(3)

# === Авторизация ===
def is_authorized(user_id: int) -> bool:
    return not MOD_IDS or user_id in MOD_IDS

# === Хендлеры ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id):
        await update.message.reply_text("⛔ Доступ только для модераторов.")
        return ConversationHandler.END
    await update.message.reply_text("📝 Отправьте заголовок новости.")
    return TITLE

async def got_title(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["title"] = update.message.text.strip()
    await update.message.reply_text("✏️ Теперь пришлите текст новости (Markdown разрешён).")
    return BODY

async def got_body(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["body"] = update.message.text_html or update.message.text
    await update.message.reply_text("📸 Пришлите изображение (как фото) или /skip чтобы пропустить.")
    return IMAGE

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

# === Публикация поста ===
async def publish(update: Update, context: ContextTypes.DEFAULT_TYPE, photo_file: Optional[str]):
    try:
        data = {
            "title": context.user_data["title"],
            "body": context.user_data["body"],
            "tag_slugs": DEFAULT_TAGS,
        }
        files = {"cover": open(photo_file, "rb")} if photo_file else None
        headers = {"X-API-KEY": API_KEY}

        # Отправка POST запроса
        r = requests.post(
            f"{API_BASE}/posts/",
            data=data,
            files=files,
            headers=headers,
            timeout=120,  # увеличили таймаут
        )
        if files:
            files["cover"].close()

        if r.ok:
            post = r.json()
            url = f"{API_BASE.replace('/api', '')}/#/post/{post['slug']}"
            await update.message.reply_text(f"✅ Опубликовано: {url}")
        else:
            error_text = r.text[:500] + "...[обрезано]" if len(r.text) > 500 else r.text
            await update.message.reply_text(f"❌ Ошибка публикации ({r.status_code}): {error_text}")

    except requests.exceptions.Timeout:
        await update.message.reply_text("⏱️ Ошибка: сервер не ответил вовремя (таймаут).")
    except Exception as e:
        await update.message.reply_text(f"💥 Не удалось опубликовать новость: {e}")

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🚫 Отмена.")
    return ConversationHandler.END

# === Инициализация Telegram-приложения ===
def build_app() -> Application:
    app = Application.builder().token(TOKEN).build()
    conv = ConversationHandler(
        entry_points=[CommandHandler("new", start)],
        states={
            TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_title)],
            BODY: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_body)],
            IMAGE: [
                CommandHandler("skip", skip_image),
                MessageHandler(filters.PHOTO, got_image),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )
    app.add_handler(CommandHandler("start", start))
    app.add_handler(conv)
    return app

# === Прогрев backend перед стартом ===
def wake_backend():
    try:
        print("🌐 Warming up backend...")
        requests.get(f"{API_BASE}/posts/?page=1", timeout=10)
    except Exception:
        print("⚠️ Backend warm-up failed (maybe sleeping on free plan).")

# === Защищённый запуск с перезапуском при ошибках ===
if __name__ == "__main__":
    wake_backend()
    print("🤖 Starting Telegram bot...")

    while True:
        try:
            app = build_app()
            app.run_polling()
        except Conflict:
            print("⚠️ Conflict detected — another instance is running. Waiting 30s...")
            time.sleep(30)
            continue
        except (NetworkError, TimedOut) as e:
            print(f"🌐 Network error: {e}. Retrying in 15s...")
            time.sleep(15)
            continue
        except Exception as e:
            print(f"💥 Unexpected error: {e}. Restarting in 60s...")
            time.sleep(60)
            continue

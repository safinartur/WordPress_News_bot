import os
from dotenv import load_dotenv
from typing import Dict, Any
import requests

from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, ConversationHandler, filters, ContextTypes

load_dotenv()

API_BASE = os.getenv("BACKEND_API_BASE", "http://127.0.0.1:8000/api")
API_KEY = os.getenv("API_SHARED_KEY")
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
MOD_IDS = set([int(x) for x in os.getenv("MODERATOR_IDS","").split(",") if x.strip().isdigit()])
DEFAULT_TAGS = [t.strip() for t in os.getenv("DEFAULT_TAGS","").split(",") if t.strip()]

TITLE, BODY, IMAGE = range(3)

def is_authorized(user_id: int) -> bool:
    return not MOD_IDS or user_id in MOD_IDS

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id):
        await update.message.reply_text("⛔ Доступ только для модераторов.")
        return ConversationHandler.END
    await update.message.reply_text("Отправьте заголовок новости.")
    return TITLE

async def got_title(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["title"] = update.message.text.strip()
    await update.message.reply_text("Ок. Теперь пришлите текст новости (Markdown разрешён).")
    return BODY

async def got_body(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["body"] = update.message.text_html or update.message.text
    await update.message.reply_text("Пришлите изображение (как фото) или /skip чтобы пропустить.")
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

async def publish(update: Update, context: ContextTypes.DEFAULT_TYPE, photo_file: str | None):
    data = {
        "title": context.user_data["title"],
        "body": context.user_data["body"],
        "tag_slugs": DEFAULT_TAGS,
    }
    files = {}
    if photo_file:
        files["cover"] = open(photo_file, "rb")
    headers = {"X-API-KEY": API_KEY}
    r = requests.post(f"{API_BASE}/posts/", data=data, files=files if files else None, headers=headers, timeout=30)
    if files:
        files["cover"].close()
    if r.ok:
        post = r.json()
        url = f"{API_BASE.replace('/api','')}/#/post/{post['slug']}"
        await update.message.reply_text(f"✅ Опубликовано: {url}")
    else:
        error_text = r.text
        if len(error_text) > 500:
            error_text = error_text[:500] + "...[обрезано]"
        await update.message.reply_text(f"❌ Ошибка публикации ({r.status_code}): {error_text}")


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Отмена.")
    return ConversationHandler.END

def main():
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
    app.run_polling()

if __name__ == "__main__":
    main()

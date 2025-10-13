import os
import time
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

# === Загрузка переменных окружения ===
load_dotenv()

API_BASE = os.getenv("BACKEND_API_BASE", "http://127.0.0.1:8000/api")
API_KEY = os.getenv("API_SHARED_KEY")
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
MOD_IDS = set([int(x) for x in os.getenv("MODERATOR_IDS", "").split(",") if x.strip().isdigit()])
DEFAULT_TAGS = [t.strip() for t in os.getenv("DEFAULT_TAGS", "").split(",") if t.strip()]

TITLE, BODY, TAGS, IMAGE = range(4)

# --- Основные теги для выбора ---
MAIN_TAGS = [
    ("новости", "📰 Новости"),
    ("общество", "🏙 Общество"),
    ("политика", "🏛 Политика"),
    ("экономика", "💰 Экономика"),
    ("транспорт", "🚗 Транспорт"),
    ("экология", "🌿 Экология"),
]


# === Проверка прав модератора ===
def is_authorized(user_id: int) -> bool:
    return not MOD_IDS or user_id in MOD_IDS


# === Извлечение slug из ссылки ===
def extract_slug(text: str) -> str:
    text = text.strip()
    if "#/post/" in text:
        return text.split("#/post/")[-1].split("?")[0].split("#")[0].strip("/")
    if "/post/" in text:
        return text.split("/post/")[-1].split("?")[0].split("#")[0].strip("/")
    return text


# === /start ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id):
        await update.message.reply_text("⛔ Доступ только для модераторов.")
        return ConversationHandler.END
    await update.message.reply_text("👋 Отправьте заголовок новости.")
    return TITLE


# === Получение заголовка ===
async def got_title(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["title"] = update.message.text.strip()
    await update.message.reply_text("📝 Теперь пришлите текст новости (Markdown разрешён).")
    return BODY


# === Получение текста ===
async def got_body(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["body"] = update.message.text or update.message.caption or ""

    # создаём inline-кнопки тегов
    buttons = [[InlineKeyboardButton(label, callback_data=slug)] for slug, label in MAIN_TAGS]
    buttons.append([InlineKeyboardButton("✅ Продолжить", callback_data="done")])

    await update.message.reply_text(
        "🏷 Выберите один или несколько тегов (нажимайте подряд):",
        reply_markup=InlineKeyboardMarkup(buttons),
    )
    context.user_data["tag_slugs"] = []
    return TAGS     # ← ОБЯЗАТЕЛЬНО это состояние


# === Обработка нажатий на кнопки тегов ===
async def select_tag(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    tag = query.data

    if tag == "done":
        if not context.user_data.get("tag_slugs"):
            context.user_data["tag_slugs"] = DEFAULT_TAGS
        await query.edit_message_text(
            "📷 Пришлите изображение (как фото) или /skip чтобы пропустить."
        )
        return IMAGE

    # добавляем тег, если его нет
    tags = context.user_data.get("tag_slugs", [])
    if tag not in tags:
        tags.append(tag)
    context.user_data["tag_slugs"] = tags

    selected = ", ".join(tags)
    await query.edit_message_text(
        f"✅ Вы выбрали: {selected}\n\nМожно выбрать ещё или нажать ✅ Продолжить.",
        reply_markup=InlineKeyboardMarkup(
            [[InlineKeyboardButton(label, callback_data=slug)] for slug, label in MAIN_TAGS]
            + [[InlineKeyboardButton("✅ Продолжить", callback_data="done")]]
        ),
    )
    return TAGS


# === Пропуск фото ===
async def skip_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await publish(update, context, photo_file=None)
    return ConversationHandler.END


# === Получение фото ===
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


# === Проверка backend и публикация ===
async def publish(update: Update, context: ContextTypes.DEFAULT_TYPE, photo_file: Optional[str]):
    print("📤 Публикация новости...")

    try:
        # проверяем backend
        ping_url = f"{API_BASE}/posts/?page=1"
        print(f"🌐 Проверяю backend: {ping_url}")

        backend_ready = False
        for attempt in range(3):
            try:
                ping_start = time.time()
                resp = requests.get(ping_url, timeout=10)
                ping_time = round(time.time() - ping_start, 2)
                if resp.ok:
                    print(f"✅ Backend отвечает за {ping_time}s (попытка {attempt+1})")
                    backend_ready = True
                    break
            except requests.exceptions.RequestException as e:
                print(f"🟥 Попытка {attempt+1}: {e}")
            if attempt < 2:
                await update.message.reply_text("💤 Backend просыпается... подожди немного...")
                time.sleep(5)

        if not backend_ready:
            await update.message.reply_text("🟥 Backend не ответил после 3 попыток. Попробуй чуть позже.")
            return

        # формируем данные
        data = {
            "title": context.user_data.get("title", "(без названия)"),
            "body": context.user_data.get("body", "(без текста)"),
            "tag_slugs": context.user_data.get("tag_slugs", DEFAULT_TAGS),
        }
        files = {"cover": open(photo_file, "rb")} if photo_file else None
        headers = {"X-API-KEY": API_KEY}

        print(f"➡️ POST {API_BASE}/posts/ | Теги: {data['tag_slugs']}")
        r = requests.post(f"{API_BASE}/posts/", data=data, files=files, headers=headers, timeout=(10, 30))
        if files:
            files["cover"].close()

        print(f"⬅️ Ответ backend: {r.status_code}")

        if r.ok:
            post = r.json()
            FRONTEND_BASE = os.getenv("FRONTEND_BASE", API_BASE.replace("/api", ""))
            url = f"{FRONTEND_BASE}/#/post/{post['slug']}"
            await update.message.reply_text(f"✅ Опубликовано успешно:\n{url}")
        else:
            await update.message.reply_text(f"❌ Ошибка публикации ({r.status_code}): {r.text[:300]}")

    except Exception as e:
        print(f"💥 Ошибка publish(): {e}")
        await update.message.reply_text(f"💥 Ошибка публикации: {e}")
    finally:
        print("✅ publish() завершена.")


# === /delete ===
async def delete_post(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id):
        await update.message.reply_text("⛔ Доступ только для модераторов.")
        return

    text = update.message.text.strip().split(maxsplit=1)
    if len(text) < 2:
        await update.message.reply_text("ℹ️ Использование: /delete <slug или ссылка>")
        return

    slug = extract_slug(text[1])
    delete_url = f"{API_BASE}/posts/{slug}/"
    headers = {"X-API-KEY": API_KEY}

    await update.message.reply_text(f"🗑 Удаляю пост `{slug}`...", parse_mode="Markdown")

    try:
        resp = requests.delete(delete_url, headers=headers, timeout=10)
        if resp.status_code == 200:
            await update.message.reply_text(f"✅ Пост `{slug}` успешно удалён.", parse_mode="Markdown")
        elif resp.status_code == 404:
            await update.message.reply_text(f"❌ Пост `{slug}` не найден.")
        elif resp.status_code == 403:
            await update.message.reply_text("🚫 Неверный API ключ.")
        else:
            await update.message.reply_text(f"⚠️ Ошибка ({resp.status_code}): {resp.text[:300]}")
    except Exception as e:
        await update.message.reply_text(f"💥 Ошибка удаления: {e}")


# === /cancel ===
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Отмена операции.")
    return ConversationHandler.END


# === /status ===
async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        r = requests.get(f"{API_BASE}/posts/?page=1", timeout=8)
        if r.ok:
            await update.message.reply_text("✅ Backend доступен и отвечает.")
        else:
            await update.message.reply_text(f"⚠️ Backend ответил с ошибкой ({r.status_code}).")
    except Exception as e:
        await update.message.reply_text(f"🟥 Backend недоступен: {e}")


# === Инициализация приложения ===
def build_app():
    app = Application.builder().token(TOKEN).build()

    conv_new = ConversationHandler(
    entry_points=[CommandHandler("new", start)],
    states={
        TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_title)],
        BODY: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_body)],
        TAGS: [CallbackQueryHandler(select_tag)],
        IMAGE: [
            CommandHandler("skip", skip_image),
            MessageHandler(filters.PHOTO, got_image),
        ],
    },
    fallbacks=[CommandHandler("cancel", cancel)],
    per_message=True,     # ✅ теперь inline-кнопки отслеживаются всегда
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("delete", delete_post))
    app.add_handler(conv_new)
    return app


# === Пробуждение backend ===
def wake_backend():
    try:
        print(f"🌐 Пробую разбудить backend: {API_BASE}/posts/?page=1")
        r = requests.get(f"{API_BASE}/posts/?page=1", timeout=10)
        if r.ok:
            print("✅ Backend доступен.")
        else:
            print(f"⚠️ Backend ответил кодом {r.status_code}")
    except Exception as e:
        print(f"⚠️ Backend пока недоступен: {e}")


# === Основной цикл ===
if __name__ == "__main__":
    wake_backend()
    print("🤖 Запуск Telegram-бота...")

    while True:
        try:
            app = build_app()
            app.run_polling()
        except Conflict:
            print("⚠️ Conflict: другой бот уже запущен. Жду 30 секунд...")
            time.sleep(30)
            continue
        except (NetworkError, TimedOut) as e:
            print(f"🌐 NetworkError: {e}. Повтор через 15 секунд...")
            time.sleep(15)
            continue
        except Exception as e:
            print(f"💥 Непредвиденная ошибка: {e}. Перезапуск через 60 секунд...")
            time.sleep(60)
            continue

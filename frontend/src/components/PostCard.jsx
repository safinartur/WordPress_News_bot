import React from 'react'
import { Link } from 'react-router-dom'

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

const TAG_TRANSLATIONS = {
  novosti: 'Новости',
  obshchestvo: 'Общество',
  politika: 'Политика',
  ekonomika: 'Экономика',
  transport: 'Транспорт',
  ekologiia: 'Экология',
}

export default function PostCard({ post }) {
  const date = new Date(post.created_at)
  const formatted = `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

  // 🧩 Логика превью: если короткий текст, показываем полностью
  const cleanBody = (post.body || '').replace(/\n/g, ' ').trim()
  const preview =
    cleanBody.length > 180 ? cleanBody.slice(0, 180) + '…' : cleanBody || 'Без описания'

  return (
    <article
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        marginBottom: '20px',
        transition: 'transform 0.2s ease',
      }}
      className="post-card"
    >
      {/* 🖼 Фото слева, крупное */}
      {post.cover ? (
        <Link
          to={`/post/${post.slug}`}
          style={{
            display: 'block',
            width: '40%', // фото занимает почти половину карточки
            maxWidth: '320px',
            background: '#f8f8f8',
            flexShrink: 0,
          }}
        >
          <img
            src={post.cover}
            alt={post.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover', // ✅ как на kalina39 — фото крупное
              display: 'block',
            }}
          />
        </Link>
      ) : (
        <div
          style={{
            width: '40%',
            maxWidth: '320px',
            background: '#f2f2f2',
            flexShrink: 0,
          }}
        />
      )}

      {/* 📄 Текст справа */}
      <div
        style={{
          flex: 1,
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* 🏷 Теги */}
          <div style={{ marginBottom: 6 }}>
            {post.tags?.map((t, i) => {
              const slug = typeof t === 'string' ? t : t.slug
              const name =
                typeof t === 'string'
                  ? TAG_TRANSLATIONS[t] || t
                  : TAG_TRANSLATIONS[t.slug] || t.name || t.slug
              return (
                <Link
                  key={i}
                  to={`/tag/${slug}`}
                  style={{
                    display: 'inline-block',
                    border: '1px solid #000',
                    borderRadius: '16px',
                    padding: '2px 10px',
                    fontSize: 12,
                    marginRight: 6,
                    color: '#000',
                    textDecoration: 'none',
                  }}
                >
                  {name}
                </Link>
              )
            })}
          </div>

          {/* 📰 Заголовок */}
          <h3 style={{ margin: '4px 0 6px' }}>
            <Link
              to={`/post/${post.slug}`}
              style={{
                color: '#000',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1.2rem',
                lineHeight: 1.3,
              }}
            >
              {post.title}
            </Link>
          </h3>

          {/* 📖 Текст новости */}
          <p
            style={{
              color: '#444',
              fontSize: 15,
              lineHeight: 1.55,
              marginTop: 4,
              marginBottom: 8,
            }}
          >
            {preview}
          </p>
        </div>

        {/* 📅 Дата */}
        <p
          style={{
            color: '#999',
            fontSize: 13,
            marginTop: 0,
            alignSelf: 'flex-end',
          }}
        >
          {formatted}
        </p>
      </div>
    </article>
  )
}

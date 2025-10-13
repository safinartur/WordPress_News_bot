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

  const preview =
    post.body && post.body.length > 0
      ? post.body.slice(0, 200).replace(/\n/g, ' ') + '…'
      : 'Читать далее…'

  return (
    <article
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        padding: '14px 18px',
        marginBottom: '18px',
        transition: 'transform 0.2s ease',
      }}
      className="post-card"
    >
      {/* 🖼 Картинка слева */}
      {post.cover ? (
        <Link to={`/post/${post.slug}`}>
          <img
            src={post.cover}
            alt={post.title}
            style={{
              width: '150px',
              height: '100px',
              objectFit: 'cover',
              borderRadius: 8,
              flexShrink: 0,
              marginRight: 16,
            }}
          />
        </Link>
      ) : (
        <div
          style={{
            width: '150px',
            height: '100px',
            background: '#f2f2f2',
            borderRadius: 8,
            marginRight: 16,
          }}
        />
      )}

      {/* 📄 Текст справа */}
      <div style={{ flex: 1 }}>
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
              fontSize: '1.1rem',
              lineHeight: 1.3,
            }}
          >
            {post.title}
          </Link>
        </h3>

        {/* 📖 Текст новости */}
        <p
          style={{
            color: '#555',
            fontSize: 14,
            margin: '4px 0 8px',
            lineHeight: 1.5,
          }}
        >
          {preview}
        </p>

        {/* 📅 Дата */}
        <p style={{ color: '#999', fontSize: 13, marginTop: 0 }}>
          {formatted}
        </p>
      </div>
    </article>
  )
}

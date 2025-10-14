import React from 'react'
import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  return (
    <article
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '16px',
        marginBottom: '20px',
        transition: 'transform 0.2s ease',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
      className="post-card"
    >
      {/* Картинка слева */}
      {post.cover && (
        <Link to={`/post/${post.slug}`} style={{ flexShrink: 0 }}>
          <img
            src={post.cover}
            alt={post.title}
            style={{
              width: '230px',
              height: 'auto',
              maxHeight: '180px',
              objectFit: 'contain',
              borderRadius: '8px',
              objectFit: 'cover', 
              display: 'block',
            }}
          />
        </Link>
      )}

      {/* Контент справа */}
      <div
        style={{
          flex: 1,
          minWidth: 0, // 👈 позволяет тексту переноситься, не растягивая родителя
          wordWrap: 'break-word',
          overflowWrap: 'anywhere', // 👈 предотвращает "уход" длинных ссылок
        }}
      >
        {/* Теги */}
        <div style={{ marginBottom: 8, flexWrap: 'wrap', display: 'flex', gap: '6px' }}>
          {post.tags?.length > 0 &&
            post.tags.map((t) => (
              <Link
                key={t.slug || t}
                to={`/tag/${t.slug || t}`}
                style={{
                  display: 'inline-block',
                  background: '#f4f6f8',
                  color: '#333',
                  padding: '2px 7px',
                  borderRadius: '20px',
                  fontSize: 11,
                  textDecoration: 'none',
                  border: '1px solid #000',
                }}
              >
                {t.name || t}
              </Link>
            ))}
        </div>

        {/* Заголовок */}
        <h3
          style={{
            margin: '0 0 6px',
            fontSize: '1.2rem',
            lineHeight: 1.3,
          }}
        >
          <Link
            to={`/post/${post.slug}`}
            style={{
              color: '#000',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            {post.title}
          </Link>
        </h3>

        {/* Текст */}
        <p
          style={{
            color: '#555',
            fontSize: 15,
            marginTop: 0,
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 4, // 👈 ограничим 4 строки, остальное скрывается
            WebkitBoxOrient: 'vertical',
          }}
        >
          {post.body?.trim() || 'Без описания'}
        </p>

        {/* Дата */}
        <p
          style={{
            color: '#999',
            fontSize: 13,
            marginTop: 6,
          }}
        >
          {new Date(post.created_at).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </article>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap', // ✅ предотвращает вылет текста
        alignItems: 'flex-start',
        gap: '14px',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '16px',
        marginBottom: '18px',
        transition: 'transform 0.2s ease',
      }}
      className="post-card"
    >
      {/* Картинка слева */}
      {post.cover && (
        <Link to={`/post/${post.slug}`}>
          <img
            src={post.cover}
            alt={post.title}
            style={{
              width: '180px',
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          />
        </Link>
      )}

      {/* Текст справа */}
      <div style={{ flex: 1, minWidth: '260px' }}>
        {/* Теги */}
        <div
          style={{
            marginBottom: 6,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          {post.tags?.length > 0 &&
            post.tags.map((t, i) => (
              <Link
                key={i}
                to={`/tag/${t.slug || t}`}
                style={{
                  display: 'inline-block',
                  border: '1px solid #ccc',
                  color: '#333',
                  padding: '1px 8px',
                  borderRadius: '12px',
                  fontSize: 11,
                  textDecoration: 'none',
                  background: '#fafafa',
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
            fontSize: '1.15rem',
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          <Link
            to={`/post/${post.slug}`}
            style={{
              color: '#000',
              textDecoration: 'none',
            }}
          >
            {post.title}
          </Link>
        </h3>

        {/* Текст */}
        <p
          style={{
            color: '#555',
            fontSize: 14,
            marginTop: 0,
            lineHeight: 1.5,
          }}
        >
          {(post.body ?? '').slice(0, 200).replace(/\n/g, ' ') ||
            'Читать далее…'}
        </p>

        {/* Дата */}
        <p
          style={{
            color: '#999',
            fontSize: 12,
            marginTop: 4,
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

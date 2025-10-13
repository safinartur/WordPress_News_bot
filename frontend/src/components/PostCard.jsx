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
              width: '160px',
              height: '110px',
              objectFit: 'cover',
              borderRadius: '8px',
            }}
          />
        </Link>
      )}

      {/* Текст справа */}
      <div style={{ flex: 1 }}>
        {/* Теги */}
        <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {post.tags?.length > 0 ? (
            post.tags.map((t, i) => {
              const tagSlug = typeof t === 'string' ? t : t.slug
              const tagName = typeof t === 'string' ? t.replace(/-/g, ' ') : t.name
              return (
                <Link
                  key={i}
                  to={`/tag/${tagSlug}`}
                  style={{
                    display: 'inline-block',
                    border: '1px solid #000',
                    color: '#000',
                    padding: '2px 10px',
                    borderRadius: '14px',
                    fontSize: 12,
                    textDecoration: 'none',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    background: '#fff',
                  }}
                >
                  {tagName}
                </Link>
              )
            })
          ) : (
            <span style={{ fontSize: 12, color: '#999' }}>без тегов</span>
          )}
        </div>

        {/* Заголовок */}
        <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem' }}>
          <Link
            to={`/post/${post.slug}`}
            style={{
              color: '#000',
              textDecoration: 'none',
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {post.title}
          </Link>
        </h3>

        {/* Краткий текст */}
        <p
          style={{
            color: '#555',
            fontSize: 14,
            marginTop: 0,
            lineHeight: 1.5,
          }}
        >
          {(post.body ?? '').slice(0, 180).replace(/\n/g, ' ') ||
            'Читать далее…'}
        </p>

        {/* Дата */}
        <p style={{ color: '#999', fontSize: 12, marginTop: 6 }}>
          {new Date(post.created_at).toLocaleString('ru-RU')}
        </p>
      </div>
    </article>
  )
}

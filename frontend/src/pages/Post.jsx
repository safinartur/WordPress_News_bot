import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from './Layout.jsx'
import PostCard from '../components/PostCard.jsx'

const API = import.meta.env.VITE_API_BASE

// 💬 Словарь slug → кириллическое имя
const TAG_TRANSLATIONS = {
  novosti: 'Новости',
  obshchestvo: 'Общество',
  politika: 'Политика',
  ekonomika: 'Экономика',
  transport: 'Транспорт',
  ekologiia: 'Экология',
}

export default function Post() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/posts/${slug}/`)
        const data = await r.json()
        setPost(data)

        // 🧩 Загружаем похожие посты по тегу
        if (data.tags?.length > 0) {
          const firstTag =
            typeof data.tags[0] === 'string' ? data.tags[0] : data.tags[0].slug
          const rel = await fetch(`${API}/posts/?tag=${firstTag}`)
          const relData = await rel.json()
          const filtered = relData.results.filter((p) => p.slug !== slug)
          setRelated(filtered.slice(0, 3))
        }
      } catch (err) {
        console.error('Ошибка загрузки поста:', err)
      }
    })()
  }, [slug])

  if (!post) return <Layout>Загрузка...</Layout>

  return (
    <Layout>
      <article
        style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          padding: '28px 24px',
          marginBottom: 40,
          maxWidth: 860,
          marginInline: 'auto',
        }}
      >
        {/* 🏷 Теги */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {post.tags?.length > 0 ? (
            post.tags.map((t, i) => {
              const tagSlug = typeof t === 'string' ? t : t.slug
              const tagName =
                typeof t === 'string'
                  ? TAG_TRANSLATIONS[t] || t
                  : TAG_TRANSLATIONS[t.slug] || t.name || t.slug
              return (
                <Link
                  key={i}
                  to={`/tag/${tagSlug}`}
                  style={{
                    border: '1px solid #000',
                    color: '#000',
                    padding: '3px 10px',
                    borderRadius: '16px',
                    fontSize: 12,
                    textDecoration: 'none',
                    background: '#fff',
                    fontWeight: 500,
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

        {/* 📰 Заголовок */}
        <h1
          style={{
            fontSize: '1.9rem',
            marginBottom: 10,
            lineHeight: 1.3,
            color: '#111',
            fontWeight: 800,
          }}
        >
          {post.title}
        </h1>

        {/* 📅 Дата */}
        <p style={{ color: '#777', fontSize: 13, marginTop: 0, marginBottom: 16 }}>
          {new Date(post.created_at).toLocaleString('ru-RU')}
        </p>

        {/* 🖼 Обложка */}
        {post.cover && (
          <img
            src={post.cover}
            alt=""
            style={{
              width: '100%',
              borderRadius: 8,
              margin: '20px 0',
              maxHeight: 460,
              objectFit: 'cover',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}
          />
        )}

        {/* 📄 Основной текст */}
        <div
          style={{
            fontSize: 17,
            lineHeight: 1.75,
            color: '#333',
            whiteSpace: 'pre-line',
          }}
          dangerouslySetInnerHTML={{
            __html: post.body.replace(/\n/g, '<br/>'),
          }}
        />
      </article>

      {/* 🔗 Похожие новости */}
      {related.length > 0 && (
        <section
          style={{
            background: '#f8fafc',
            borderRadius: 10,
            padding: '24px 20px',
            maxWidth: 880,
            marginInline: 'auto',
          }}
        >
          <h2
            style={{
              fontSize: '1.3rem',
              marginBottom: 16,
              fontWeight: 700,
              color: '#111',
            }}
          >
            Похожие новости
          </h2>
          {related.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </section>
      )}
    </Layout>
  )
}

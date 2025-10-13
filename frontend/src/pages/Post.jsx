import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from './Layout.jsx'
import PostCard from '../components/PostCard.jsx'

const API = import.meta.env.VITE_API_BASE

export default function Post() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])

  useEffect(() => {
    (async () => {
      const r = await fetch(`${API}/posts/${slug}/`)
      const data = await r.json()
      setPost(data)

      // 🧩 Загружаем похожие посты по тегу
      if (data.tags?.length > 0) {
        const firstTag = data.tags[0].slug
        const rel = await fetch(`${API}/posts/?tag=${firstTag}`)
        const relData = await rel.json()
        // исключаем сам пост
        const filtered = relData.results.filter((p) => p.slug !== slug)
        setRelated(filtered.slice(0, 3))
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
          padding: '24px',
          marginBottom: 40,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          {post.tags?.map((t) => (
            <Link
              key={t.slug}
              to={`/tag/${t.slug}`}
              style={{
                display: 'inline-block',
                background: '#f4f6f8',
                color: '#333',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: 12,
                textDecoration: 'none',
                marginRight: 6,
              }}
            >
              {t.name}
            </Link>
          ))}
        </div>

        <h1
          style={{
            fontSize: '1.8rem',
            marginBottom: 10,
            lineHeight: 1.3,
            color: '#111',
          }}
        >
          {post.title}
        </h1>

        <p style={{ color: '#999', fontSize: 13, marginTop: 0 }}>
          {new Date(post.created_at).toLocaleString('ru-RU')}
        </p>

        {post.cover && (
          <img
            src={post.cover}
            alt=""
            style={{
              width: '100%',
              borderRadius: 8,
              margin: '20px 0',
              maxHeight: 420,
              objectFit: 'cover',
            }}
          />
        )}

        <div
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: '#333',
            whiteSpace: 'pre-line',
          }}
          dangerouslySetInnerHTML={{
            __html: post.body.replace(/\n/g, '<br/>'),
          }}
        />
      </article>

      {related.length > 0 && (
        <section
          style={{
            background: '#f8fafc',
            borderRadius: 10,
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Похожие новости</h2>
          {related.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </section>
      )}
    </Layout>
  )
}

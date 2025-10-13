import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from './Layout.jsx'
import PostCard from '../components/PostCard.jsx'

const API = import.meta.env.VITE_API_BASE

export default function Tag() {
  const { slug } = useParams()
  const [posts, setPosts] = useState([])
  const [tagName, setTagName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const r = await fetch(`${API}/posts/?tag=${slug}`)
        const data = await r.json()
        setPosts(data.results || [])
        setTagName(
          slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        )
      } catch (err) {
        console.error('Ошибка загрузки тегов:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) return <Layout>Загрузка...</Layout>

  return (
    <Layout>
      <div
        style={{
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 10,
          padding: '24px 20px',
          marginBottom: 30,
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <h2
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            margin: 0,
            color: '#000',
          }}
        >
          🏷 Тег: {tagName}
        </h2>
        <p style={{ color: '#555', marginTop: 6 }}>
          {posts.length
            ? `Найдено ${posts.length} новостей`
            : 'Пока нет новостей в этой категории'}
        </p>
      </div>

      {posts.map((p) => (
        <PostCard key={p.slug} post={p} />
      ))}

      {posts.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#999',
          }}
        >
          📰 Здесь пока нет материалов.
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <Link
          to="/"
          style={{
            color: '#ed7070',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          ← Вернуться ко всем новостям
        </Link>
      </div>
    </Layout>
  )
}

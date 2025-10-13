import React, { useEffect, useState, useRef } from 'react'
import Layout from './Layout.jsx'
import PostCard from '../components/PostCard.jsx'
import Sidebar from '../components/Sidebar.jsx'

const API = import.meta.env.VITE_API_BASE

export default function App() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef(null)

  async function load(p = 1) {
    if (loading) return
    setLoading(true)
    try {
      const r = await fetch(`${API}/posts/?page=${p}`)
      const data = await r.json()

      if (data.results.length < 10) setHasMore(false)
      setPosts((prev) => (p === 1 ? data.results : [...prev, ...data.results]))
    } catch (err) {
      console.error('Ошибка загрузки новостей:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [])

  // Подключаем IntersectionObserver для автоподгрузки
  useEffect(() => {
    if (!hasMore || loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1
          setPage(nextPage)
          load(nextPage)
        }
      },
      { threshold: 1.0 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [page, hasMore, loading])

  return (
    <Layout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '20px',
        }}
      >
        {/* Левая часть — основная лента */}
        <div
          style={{
            flex: 1,
            background: '#f8fafc',
            padding: '24px',
            borderRadius: 8,
            minHeight: '100vh',
          }}
        >
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}

          {/* Лоадер (невидимый триггер) */}
          {hasMore && (
            <div
              ref={loaderRef}
              style={{
                height: 50,
                textAlign: 'center',
                color: '#777',
                fontSize: 14,
              }}
            >
              {loading ? 'Загрузка...' : 'Прокрутите ниже, чтобы подгрузить ещё'}
            </div>
          )}

          {!hasMore && (
            <div
              style={{
                textAlign: 'center',
                color: '#aaa',
                marginTop: 20,
              }}
            >
              Больше новостей нет.
            </div>
          )}
        </div>

        {/* Правая колонка — Sidebar */}
        <Sidebar />
      </div>
    </Layout>
  )
}

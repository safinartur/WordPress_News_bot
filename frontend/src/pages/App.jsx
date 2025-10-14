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

  // === Загрузка новостей ===
  async function load(p = 1) {
    if (loading) return
    setLoading(true)
    try {
      const r = await fetch(`${API}/posts/?page=${p}`)
      const data = await r.json()

      // Если результатов меньше 10 — это последняя страница
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

  // === IntersectionObserver для автоподгрузки ===
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

  // === Разметка ===
  return (
    <Layout>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '32px',
          maxWidth: 1250,
          margin: '0 auto',
          padding: '24px 20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Левая часть — основная лента */}
        <div
          style={{
            flex: '1 1 0%',
            background: '#f8fafc',
            padding: '24px',
            borderRadius: 10,
            minWidth: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}

          {/* Лоадер — невидимый триггер автоподгрузки */}
          {hasMore && (
            <div
              ref={loaderRef}
              style={{
                height: 60,
                textAlign: 'center',
                color: '#777',
                fontSize: 14,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
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
        <div
          style={{
            width: '260px',
            flexShrink: 0,
            position: 'relative',
            top: 0,
          }}
        >
          <Sidebar />
        </div>
      </div>
    </Layout>
  )
}

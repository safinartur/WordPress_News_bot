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
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '24px',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px',
          flexWrap: 'wrap', // ✅ делает адаптив на телефонах
        }}
      >
        {/* Основная лента */}
        <div
          style={{
            flex: 1,
            background: '#f8fafc',
            padding: '20px',
            borderRadius: 8,
            minHeight: '100vh',
            maxWidth: '860px',
          }}
        >
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}

          {/* Лоадер (триггер подгрузки) */}
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

        {/* Sidebar исчезает на телефонах */}
        <div className="sidebar-wrapper" style={{ display: 'none' }}>
          <Sidebar />
        </div>
      </div>

      {/* 🧩 CSS адаптив */}
      <style>
        {`
          @media (min-width: 1000px) {
            .sidebar-wrapper {
              display: block;
            }
          }
        `}
      </style>
    </Layout>
  )
}

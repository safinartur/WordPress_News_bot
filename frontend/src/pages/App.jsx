import React, { useEffect, useState, useRef } from 'react'
import Layout from './Layout.jsx'
import PostCard from '../components/PostCard.jsx'

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

      // если меньше 10 результатов — это последняя страница
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

  // Подключаем IntersectionObserver
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
          background: '#f8fafc',
          padding: '24px',
          borderRadius: 8,
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}

        {/* Лоадер (невидимый, триггерит подгрузку) */}
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
          <div style={{ textAlign: 'center', color: '#aaa', marginTop: 20 }}>
            Больше новостей нет.
          </div>
        )}
      </div>
    </Layout>
  )
}

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
      <div className="main-container">
        {/* Основная лента */}
        <div className="news-feed">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}

          {/* Лоадер (триггер подгрузки) */}
          {hasMore && (
            <div ref={loaderRef} className="load-more">
              {loading ? 'Загрузка...' : 'Прокрутите ниже, чтобы подгрузить ещё'}
            </div>
          )}

          {!hasMore && (
            <div className="no-more">Больше новостей нет.</div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* Адаптив CSS */}
      <style>{`
        .main-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
          flex-wrap: wrap;
        }

        .news-feed {
          flex: 1;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          min-height: 100vh;
          max-width: 860px;
        }

        .load-more {
          height: 50px;
          text-align: center;
          color: #777;
          font-size: 14px;
          margin-top: 10px;
        }

        .no-more {
          text-align: center;
          color: #aaa;
          margin-top: 20px;
        }

        /* === 📱 Мобильная версия === */
        @media (max-width: 999px) {
          .main-container {
            flex-direction: column;
            padding: 10px;
          }

          .news-feed {
            max-width: 100%;
            padding: 14px;
            background: transparent;
          }

          aside {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  )
}

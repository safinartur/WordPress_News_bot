import React, { useEffect, useState } from 'react'
import Layout from './Layout.jsx'
import PostCard from '../components/PostCard.jsx'

const API = import.meta.env.VITE_API_BASE

export default function App() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [next, setNext] = useState(true)

  async function load(p = 1) {
    const r = await fetch(`${API}/posts/?page=${p}`)
    const data = await r.json()
    setPosts((prev) => (p === 1 ? data.results : [...prev, ...data.results]))
    setNext(!!data.next)
  }

  useEffect(() => {
    load(1)
  }, [])

  return (
    <Layout>
      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: 8 }}>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {next && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => {
                const np = page + 1
                setPage(np)
                load(np)
              }}
              style={{
                padding: '10px 30px',
                border: 'none',
                background: '#ed7070',
                color: '#fff',
                borderRadius: '6px',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Загрузить ещё
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_BASE
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

export default function Sidebar() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    ;(async () => {
      const r = await fetch(`${API}/posts/?page=1`)
      const data = await r.json()
      setPosts(data.results.slice(0, 5))
    })()
  }, [])

  return (
    <aside
      style={{
        width: '260px',
        marginLeft: '30px',
        padding: '10px 0',
        flexShrink: 0,
      }}
    >
      <h3
        style={{
          fontSize: '1rem',
          borderBottom: '1px solid #ddd',
          paddingBottom: 6,
          marginBottom: 10,
        }}
      >
        Новости одной строкой
      </h3>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {posts.map((p) => {
          const d = new Date(p.created_at)
          const formatted = `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d
            .getHours()
            .toString()
            .padStart(2, '0')}:${d
            .getMinutes()
            .toString()
            .padStart(2, '0')}`
          return (
            <li key={p.slug} style={{ marginBottom: 10 }}>
              <Link
                to={`/post/${p.slug}`}
                style={{
                  color: '#000',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {p.title}
              </Link>
              <br />
              <span style={{ color: '#888', fontSize: 12 }}>{formatted}</span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

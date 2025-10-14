import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_BASE
const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

function Sidebar() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API}/posts/?page=1`)
        const data = await r.json()
        setPosts(data.results.slice(0, 5))
      } catch (err) {
        console.error('Ошибка загрузки Sidebar:', err)
      }
    })()
  }, [])

  return (
    <aside
      style={{
        position: 'sticky',
        top: '90px',
        width: '220px',
        flex: '0 0 220px',
        background: '#fff',
        padding: '16px 14px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        height: 'fit-content',
        alignSelf: 'flex-start',
        overflow: 'hidden',
      }}
    >
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid #eee',
          paddingBottom: 6,
          marginBottom: 10,
          color: '#111',
          whiteSpace: 'nowrap',
        }}
      >
        🗞 Новости одной строкой
      </h3>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {posts.map((p, i) => {
          const d = new Date(p.created_at)
          const formatted = `${d.getDate()} ${
            MONTHS[d.getMonth()]
          } • ${d.getHours().toString().padStart(2, '0')}:${d
            .getMinutes()
            .toString()
            .padStart(2, '0')}`

          return (
            <li
              key={p.slug || i}
              style={{
                marginBottom: 12,
                borderBottom:
                  i < posts.length - 1 ? '1px solid #f1f1f1' : 'none',
                paddingBottom: 8,
              }}
            >
              <Link
                to={`/post/${p.slug}`}
                style={{
                  color: '#000',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  lineHeight: 1.25,
                }}
              >
                {p.title.length > 60
                  ? p.title.slice(0, 60) + '...'
                  : p.title}
              </Link>
              <br />
              <span style={{ color: '#888', fontSize: 11 }}>{formatted}</span>
            </li>
          )
        })}
      </ul>

      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            color: '#e05a5a',
            border: '1px solid #e05a5a',
            borderRadius: '18px',
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => (e.target.style.background = '#e05a5a')}
          onMouseOut={(e) => (e.target.style.background = 'transparent')}
        >
          Все новости →
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_BASE
const MONTHS = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря'
]

export default function Sidebar() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API}/posts/?page=1`)
        const data = await r.json()
        setPosts(data.results.slice(0, 6))
      } catch (err) {
        console.error('Ошибка загрузки коротких новостей:', err)
      }
    })()
  }, [])

  return (
    <aside
      style={{
        width: '250px',
        flexShrink: 0,
        marginLeft: '20px',
        position: 'sticky',
        top: '20px',
        alignSelf: 'flex-start',
        background: '#f9fafb',
        borderRadius: '10px',
        padding: '14px 16px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        maxHeight: '75vh', // ограничиваем высоту окна
        overflowY: 'auto', // добавляем прокрутку внутри, если не влезает
      }}
    >
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: '#111',
          marginBottom: '10px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>📰</span> Новости одной строкой
      </h3>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {posts.map((p, i) => {
          const d = new Date(p.created_at)
          const formatted = `${d.getDate()} ${MONTHS[d.getMonth()]} • ${d
            .getHours()
            .toString()
            .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

          return (
            <li
              key={p.slug}
              style={{
                marginBottom: i === posts.length - 1 ? 0 : 10,
                paddingBottom: 10,
                borderBottom: i === posts.length - 1 ? 'none' : '1px solid #e2e8f0',
              }}
            >
              <Link
                to={`/post/${p.slug}`}
                style={{
                  color: '#000',
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: 1.4,
                  textDecoration: 'none',
                }}
              >
                {p.title.length > 60 ? p.title.slice(0, 60) + '…' : p.title}
              </Link>
              <div style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>
                {formatted}
              </div>
            </li>
          )
        })}
      </ul>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            fontSize: 12,
            color: '#ed7070',
            textDecoration: 'none',
            fontWeight: 600,
            border: '1px solid #ed7070',
            borderRadius: 20,
            padding: '4px 12px',
            transition: 'all 0.2s ease',
          }}
        >
          Все новости →
        </Link>
      </div>
    </aside>
  )
}

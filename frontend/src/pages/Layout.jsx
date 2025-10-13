import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const location = useLocation()

  const menuTags = [
    { slug: 'novosti', name: 'Новости' },
    { slug: 'obshchestvo', name: 'Общество' },
    { slug: 'politika', name: 'Политика' },
    { slug: 'ekonomika', name: 'Экономика' },
    { slug: 'transport', name: 'Транспорт' },
    { slug: 'ekologiia', name: 'Экология' },
  ]

  return (
    <div
      style={{
        background: '#f8f9fa',
        minHeight: '100vh',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#1a1a1a',
      }}
    >
      {/* Верхняя шапка */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          marginBottom: 30,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Логотип */}
          <Link
            to="/"
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#1a1a1a',
              textDecoration: 'none',
              letterSpacing: '-0.5px',
            }}
          >
            <span style={{ color: '#d92b2b' }}>Padua</span>
            <span style={{ color: '#222' }}>.news</span>
          </Link>

          {/* Меню */}
          <nav
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {menuTags.map((t) => {
              const active =
                location.pathname.includes(`/tag/${t.slug}`) ||
                (t.slug === 'novosti' && location.pathname === '/')
              return (
                <Link
                  key={t.slug}
                  to={`/tag/${t.slug}`}
                  style={{
                    color: active ? '#d92b2b' : '#333',
                    textDecoration: 'none',
                    fontWeight: active ? 700 : 500,
                    fontSize: 15,
                    borderBottom: active ? '2px solid #d92b2b' : '2px solid transparent',
                    paddingBottom: 2,
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                >
                  {t.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Контент */}
      <main
        style={{
          maxWidth: 880,
          margin: '0 auto',
          padding: '0 20px 60px',
        }}
      >
        {children}
      </main>

      {/* Подвал */}
      <footer
        style={{
          background: '#fff',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center',
          padding: '20px 10px',
          color: '#555',
          fontSize: 14,
        }}
      >
        © 2025 <b>Padua.news</b> — Новости города Падуя 🇮🇹
        <div style={{ marginTop: 4, fontSize: 13, color: '#888' }}>
          Сделано с ❤️ на Django + React
        </div>
      </footer>
    </div>
  )
}

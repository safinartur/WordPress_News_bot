import React from 'react'
import { Link } from 'react-router-dom'

const NAV_TAGS = [
  { slug: 'novosti', name: 'Новости' },
  { slug: 'obshchestvo', name: 'Общество' },
  { slug: 'politika', name: 'Политика' },
  { slug: 'ekonomika', name: 'Экономика' },
  { slug: 'transport', name: 'Транспорт' },
  { slug: 'ekologiya', name: 'Экология' },
]

export default function Layout({ children }) {
  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* === Header === */}
      <header
        style={{
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          padding: '20px 0',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>
            <Link to="/" style={{ color: '#000', textDecoration: 'none' }}>
              Новости Падуи
            </Link>
          </h1>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#e34b4b', fontWeight: 600, textDecoration: 'none' }}
          >
            Мы в Telegram
          </a>
        </div>

        {/* === Navigation === */}
        <nav
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderTop: '1px solid #f0f0f0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {NAV_TAGS.map((tag) => (
            <Link
              key={tag.slug}
              to={`/tag/${tag.slug}`}
              style={{
                color: '#444',
                fontWeight: 500,
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#ed7070')}
              onMouseLeave={(e) => (e.target.style.color = '#444')}
            >
              {tag.name}
            </Link>
          ))}
        </nav>
      </header>

      {/* === Content === */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
        {children}
      </main>

      {/* === Footer === */}
      <footer
        style={{
          marginTop: 40,
          padding: '20px 0',
          textAlign: 'center',
          color: '#777',
          fontSize: 14,
        }}
      >
        © {new Date().getFullYear()} Новости Падуи
      </footer>
    </div>
  )
}

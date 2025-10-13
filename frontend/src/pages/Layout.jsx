import React from 'react'
import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div
      style={{
        fontFamily: 'Lato, sans-serif',
        backgroundColor: '#fff',
        color: '#222',
        minHeight: '100vh',
      }}
    >
      <header
        style={{
          backgroundColor: '#f8fafc',
          padding: '16px 24px',
          borderBottom: '1px solid #eee',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ margin: 0 }}>
            <Link to="/" style={{ color: '#000', textDecoration: 'none' }}>
              Новости Падуи
            </Link>
          </h1>
          <nav>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#ed7070', textDecoration: 'none' }}
            >
              Мы в Telegram
            </a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto' }}>{children}</main>

      <footer
        style={{
          textAlign: 'center',
          marginTop: 40,
          padding: 20,
          borderTop: '1px solid #eee',
          color: '#999',
        }}
      >
        © {new Date().getFullYear()} Падуя Инфо
      </footer>
    </div>
  )
}

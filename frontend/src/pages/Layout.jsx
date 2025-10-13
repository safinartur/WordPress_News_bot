import React from "react"
import { Link } from "react-router-dom"
import "../Padua.css"

export default function Layout({ children }) {
  return (
    <>
      <header>
        <h1 style={{ margin: 0, fontFamily: "Merriweather, serif" }}>
          <Link to="/" style={{ color: "white", textDecoration: "none" }}>
            Padova News
          </Link>
        </h1>
        <nav>
          <Link to="/">Главная</Link>
          <Link to="/tag/cultura">Культура</Link>
          <Link to="/tag/sport">Спорт</Link>
          <Link to="/tag/politica">Политика</Link>
          <a href="https://t.me/" target="_blank" rel="noreferrer">
            Telegram
          </a>
        </nav>
      </header>

      <main>{children}</main>

      <footer>
        © {new Date().getFullYear()} Padova News — новости города Падуя |
        <a href="https://t.me/" style={{ color: "#2a5f8b", marginLeft: 6 }}>
          наш Telegram
        </a>
      </footer>
    </>
  )
}

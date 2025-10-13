import React, { useEffect, useState } from "react"
import Layout from "./Layout.jsx"
import PostCard from "../components/PostCard.jsx"
import "../Padua.css"

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
      <section
        style={{
          background:
            "url('https://upload.wikimedia.org/wikipedia/commons/e/e1/Padova_Piazza_delle_Erbe.jpg') center/cover",
          color: "white",
          borderRadius: 12,
          textAlign: "center",
          padding: "4rem 1rem",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontFamily: "Merriweather, serif",
            fontSize: "2.4rem",
            textShadow: "1px 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          Добро пожаловать в Падую
        </h2>
        <p
          style={{
            fontSize: "1.1rem",
            background: "rgba(0,0,0,0.5)",
            display: "inline-block",
            padding: "0.5rem 1rem",
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          Новости, события и жизнь города
        </p>
      </section>

      <div className="news-grid">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      {next && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            onClick={() => {
              const np = page + 1
              setPage(np)
              load(np)
            }}
            style={{
              background: "var(--link)",
              color: "white",
              padding: "10px 25px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Загрузить ещё
          </button>
        </div>
      )}
    </Layout>
  )
}

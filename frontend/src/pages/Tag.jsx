import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Layout from "./Layout.jsx"
import PostCard from "../components/PostCard.jsx"
import "../Padua.css"

const API = import.meta.env.VITE_API_BASE

export default function Tag() {
  const { slug } = useParams()
  const [posts, setPosts] = useState([])
  const [tagTitle, setTagTitle] = useState(slug)

  useEffect(() => {
    (async () => {
      // Загружаем новости по тегу
      const r = await fetch(`${API}/posts/?tag=${slug}`)
      const data = await r.json()
      setPosts(data.results || [])

      // Пробуем взять "человекочитаемое" имя тега, если оно есть
      if (data.results?.length > 0 && data.results[0].tags?.length > 0) {
        const match = data.results[0].tags.find((t) => t.slug === slug)
        if (match) setTagTitle(match.name)
      }
    })()
  }, [slug])

  return (
    <Layout>
      {/* Hero header */}
      <section
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://upload.wikimedia.org/wikipedia/commons/e/e1/Padova_Piazza_delle_Erbe.jpg') center/cover",
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
            fontSize: "2rem",
            textShadow: "1px 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          Тег: {tagTitle}
        </h2>
        <p
          style={{
            fontSize: "1.1rem",
            background: "rgba(0,0,0,0.5)",
            display: "inline-block",
            padding: "0.4rem 1rem",
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          Все новости по теме
        </p>
      </section>

      {/* Posts list */}
      {posts.length > 0 ? (
        <div className="news-grid">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", opacity: 0.7 }}>
          Новостей по тегу «{tagTitle}» пока нет.
        </p>
      )}
    </Layout>
  )
}

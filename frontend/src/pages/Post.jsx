import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import Layout from "./Layout.jsx"
import "../Padua.css"

const API = import.meta.env.VITE_API_BASE

export default function Post() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])

  useEffect(() => {
    (async () => {
      const r = await fetch(`${API}/posts/${slug}/`)
      const data = await r.json()
      setPost(data)

      // Загружаем похожие по тегу
      if (data.tags && data.tags.length > 0) {
        const tag = data.tags[0].slug
        const rel = await fetch(`${API}/posts/?tag=${tag}`)
        const relData = await rel.json()
        setRelated(relData.results.filter(p => p.slug !== slug).slice(0, 3))
      }
    })()
  }, [slug])

  if (!post) return <Layout>Загрузка...</Layout>

  return (
    <Layout>
      {/* Hero section */}
      {post.cover && (
        <div
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${post.cover}) center/cover`,
            color: "white",
            borderRadius: 12,
            textAlign: "center",
            padding: "6rem 1rem 4rem",
            marginBottom: "2rem",
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
          }}
        >
          <h2
            style={{
              fontFamily: "Merriweather, serif",
              fontSize: "2.4rem",
              textShadow: "1px 1px 5px rgba(0,0,0,0.8)",
              marginBottom: "1rem",
            }}
          >
            {post.title}
          </h2>
          <p
            style={{
              fontSize: "1rem",
              background: "rgba(0,0,0,0.5)",
              display: "inline-block",
              padding: "0.3rem 0.8rem",
              borderRadius: 6,
            }}
          >
            {new Date(post.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
      )}

      {/* Main content */}
      <article
        style={{
          background: "white",
          borderRadius: 12,
          padding: "2rem",
          boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.8,
            color: "#2b2b2b",
          }}
          dangerouslySetInnerHTML={{
            __html: post.body.replace(/\n/g, "<br/>"),
          }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {post.tags.map((t) => (
              <Link
                key={t.slug}
                to={`/tag/${t.slug}`}
                className="tag"
                style={{ fontSize: "0.85rem" }}
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section style={{ marginTop: "3rem" }}>
          <h3
            style={{
              fontFamily: "Merriweather, serif",
              fontSize: "1.6rem",
              marginBottom: "1rem",
              color: "var(--link)",
            }}
          >
            Похожие новости
          </h3>
          <div className="news-grid">
            {related.map((p) => (
              <article key={p.slug} className="news-card">
                {p.cover && (
                  <Link to={`/post/${p.slug}`}>
                    <img src={p.cover} alt={p.title} />
                  </Link>
                )}
                <div className="content">
                  <h3>
                    <Link
                      to={`/post/${p.slug}`}
                      style={{ textDecoration: "none", color: "var(--link)" }}
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <p style={{ opacity: 0.7, fontSize: 13 }}>
                    {new Date(p.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </Layout>
  )
}

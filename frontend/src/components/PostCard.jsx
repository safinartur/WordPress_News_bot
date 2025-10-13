import React from "react"
import { Link } from "react-router-dom"
import "../Padua.css"

export default function PostCard({ post }) {
  return (
    <article className="news-card">
      {post.cover && (
        <Link to={`/post/${post.slug}`}>
          <img src={post.cover} alt={post.title} />
        </Link>
      )}
      <div className="content">
        <h3>
          <Link to={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
            {post.title}
          </Link>
        </h3>
        <p style={{ opacity: 0.7, fontSize: 13 }}>
          {new Date(post.created_at).toLocaleDateString("ru-RU")}
        </p>
        <div className="tags">
          {post.tags?.map((t) => (
            <Link key={t.slug} to={`/tag/${t.slug}`} className="tag">
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </article>
  )
}

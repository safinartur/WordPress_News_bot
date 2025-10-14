<aside
  style={{
    width: '220px',              // 👈 было 260 — стало компактнее
    marginLeft: '10px',
    padding: '12px 0',
    flexShrink: 0,
    position: 'sticky',
    top: '90px',
  }}
>
  <h3
    style={{
      fontSize: '0.95rem',
      borderBottom: '1px solid #ddd',
      paddingBottom: 6,
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <span style={{ fontSize: '1.1rem' }}>🗞</span> Новости одной строкой
  </h3>

  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
    {posts.map((p) => {
      const d = new Date(p.created_at)
      const formatted = `${d.getDate()} ${MONTHS[d.getMonth()]} • ${d
        .getHours()
        .toString()
        .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      return (
        <li
          key={p.slug}
          style={{
            marginBottom: 12,
            borderBottom: '1px solid #eee',
            paddingBottom: 8,
          }}
        >
          <Link
            to={`/post/${p.slug}`}
            style={{
              color: '#111',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',        // 👈 меньше размер
              display: 'block',
              lineHeight: 1.3,
            }}
          >
            {p.title.length > 55 ? p.title.slice(0, 55) + '…' : p.title}
          </Link>
          <span style={{ color: '#999', fontSize: 12 }}>{formatted}</span>
        </li>
      )
    })}
  </ul>

  <Link
    to="/"
    style={{
      display: 'inline-block',
      marginTop: 8,
      padding: '6px 14px',
      border: '1px solid #e44',
      borderRadius: 20,
      color: '#e44',
      fontSize: '0.85rem',
      textDecoration: 'none',
    }}
  >
    Все новости →
  </Link>
</aside>

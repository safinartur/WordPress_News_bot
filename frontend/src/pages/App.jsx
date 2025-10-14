<div
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '40px',              // 👈 больше воздуха между колонками
    maxWidth: 1300,
    margin: '0 auto',
    padding: '20px 30px',
  }}
>
  {/* Левая часть — основная лента */}
  <div
    style={{
      flex: '1 1 0%',
      background: '#f8fafc',
      padding: '24px',
      borderRadius: 8,
      minWidth: 0,
      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    }}
  >
    {posts.map((p) => (
      <PostCard key={p.slug} post={p} />
    ))}

    {hasMore && (
      <div
        ref={loaderRef}
        style={{
          height: 50,
          textAlign: 'center',
          color: '#777',
          fontSize: 14,
        }}
      >
        {loading ? 'Загрузка...' : 'Прокрутите ниже, чтобы подгрузить ещё'}
      </div>
    )}

    {!hasMore && (
      <div
        style={{
          textAlign: 'center',
          color: '#aaa',
          marginTop: 20,
        }}
      >
        Больше новостей нет.
      </div>
    )}
  </div>

  {/* Правая колонка — Sidebar */}
  <Sidebar />
</div>

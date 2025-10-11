import React, { useEffect, useState } from 'react'
import Layout from './Layout.jsx'
import PostCard from '../components/PostCard.jsx'

const API = import.meta.env.VITE_API_BASE

export default function App(){
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [next, setNext] = useState(true)

  async function load(p=1){
    const r = await fetch(`${API}/posts/?page=${p}`)
    const data = await r.json()
    setPosts(prev => p===1 ? data.results : [...prev, ...data.results])
    setNext(!!data.next)
  }

  useEffect(()=>{ load(1) }, [])

  return (
    <Layout>
      {posts.map(p => <PostCard key={p.id} post={p} />)}
      {next && <button onClick={()=>{ const np = page+1; setPage(np); load(np) }} style={{padding:'10px 20px'}}>Загрузить ещё</button>}
    </Layout>
  )
}

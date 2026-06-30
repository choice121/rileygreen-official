import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase, NewsPost } from '../../lib/supabase'
import toast from 'react-hot-toast'
import AdminModal from './AdminModal'
import Button from '../ui/Button'
import { format } from 'date-fns'

const EMPTY: Partial<NewsPost> = { title: '', slug: '', excerpt: '', content: '', cover_image: '', category: 'news', is_published: false }

export default function NewsAdmin() {
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<NewsPost>>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('news_posts').select('*').order('created_at', { ascending: false })
    if (data) setPosts(data as NewsPost[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(EMPTY); setModal(true) }
  function openEdit(p: NewsPost) { setEditing(p); setModal(true) }

  function slugify(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function save() {
    setSaving(true)
    const payload = {
      ...editing,
      slug: editing.slug || slugify(editing.title ?? ''),
      published_at: editing.is_published && !editing.published_at ? new Date().toISOString() : editing.published_at,
      updated_at: new Date().toISOString(),
    }
    let error
    if (editing.id) {
      ;({ error } = await supabase.from('news_posts').update(payload).eq('id', editing.id))
    } else {
      ;({ error } = await supabase.from('news_posts').insert(payload))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing.id ? 'Post updated!' : 'Post created!')
    setModal(false)
    load()
  }

  async function togglePublish(p: NewsPost) {
    const { error } = await supabase.from('news_posts').update({
      is_published: !p.is_published,
      published_at: !p.is_published ? new Date().toISOString() : p.published_at,
    }).eq('id', p.id)
    if (!error) { toast.success(p.is_published ? 'Unpublished' : 'Published!'); load() }
    else toast.error(error.message)
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('news_posts').delete().eq('id', id)
    if (!error) { toast.success('Deleted'); load() }
    else toast.error(error.message)
  }

  const inputCls = 'w-full bg-dark-900 border border-gold-500/20 rounded-sm px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/50 text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-cream">News Posts</h2>
        <Button onClick={openNew} size="sm"><Plus size={14} />New Post</Button>
      </div>

      {loading ? (
        <div className="text-cream/40 text-sm">Loading...</div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="flex items-center gap-4 p-4 bg-dark-800 border border-gold-500/10 rounded-sm hover:border-gold-500/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-display uppercase tracking-widest px-2 py-0.5 rounded ${p.is_published ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-cream/30'}`}>
                    {p.is_published ? 'Live' : 'Draft'}
                  </span>
                  <span className="text-xs text-gold-400/60 font-display uppercase">{p.category}</span>
                </div>
                <p className="font-medium text-cream truncate">{p.title}</p>
                <p className="text-xs text-cream/40 mt-0.5">{p.published_at ? format(new Date(p.published_at), 'MMM d, yyyy') : 'Not published'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => togglePublish(p)} className="text-cream/40 hover:text-gold-400 transition-colors p-1.5" title={p.is_published ? 'Unpublish' : 'Publish'}>
                  {p.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => openEdit(p)} className="text-cream/40 hover:text-gold-400 transition-colors p-1.5">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deletePost(p.id)} className="text-cream/40 hover:text-red-400 transition-colors p-1.5">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-cream/40 text-sm py-8 text-center">No posts yet. Create your first one!</p>}
        </div>
      )}

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Edit Post' : 'New Post'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Title *</label>
              <input className={inputCls} value={editing.title ?? ''} onChange={e => setEditing(v => ({ ...v, title: e.target.value, slug: slugify(e.target.value) }))} placeholder="Post title" />
            </div>
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Slug</label>
              <input className={inputCls} value={editing.slug ?? ''} onChange={e => setEditing(v => ({ ...v, slug: e.target.value }))} placeholder="url-slug" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Category</label>
              <select className={inputCls} value={editing.category ?? 'news'} onChange={e => setEditing(v => ({ ...v, category: e.target.value }))}>
                {['news','music','tour','video','press'].map(c => <option key={c} value={c} className="bg-dark-800">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Cover Image (ImageKit path)</label>
              <input className={inputCls} value={editing.cover_image ?? ''} onChange={e => setEditing(v => ({ ...v, cover_image: e.target.value }))} placeholder="news/my-image.jpg" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Excerpt</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={editing.excerpt ?? ''} onChange={e => setEditing(v => ({ ...v, excerpt: e.target.value }))} placeholder="Short description shown in list views..." />
          </div>
          <div>
            <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Content (HTML)</label>
            <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={10} value={editing.content ?? ''} onChange={e => setEditing(v => ({ ...v, content: e.target.value }))} placeholder="<p>Write your article content here...</p>" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={editing.is_published ?? false} onChange={e => setEditing(v => ({ ...v, is_published: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
            <span className="text-cream/70 text-sm">Publish immediately</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} loading={saving} fullWidth>Save Post</Button>
            <Button variant="ghost" onClick={() => setModal(false)} fullWidth>Cancel</Button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

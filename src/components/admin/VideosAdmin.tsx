import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import AdminModal from './AdminModal'
import Button from '../ui/Button'

type Video = { id: string; title: string; description: string; youtube_id: string; imagekit_thumbnail: string; category: string; is_featured: boolean; view_count: number }
const EMPTY: Partial<Video> = { title: '', description: '', youtube_id: '', imagekit_thumbnail: '', category: 'music_video', is_featured: false, view_count: 0 }

export default function VideosAdmin() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Video>>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false })
    if (data) setVideos(data as Video[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    let error
    if (editing.id) {
      ;({ error } = await supabase.from('videos').update(editing).eq('id', editing.id))
    } else {
      ;({ error } = await supabase.from('videos').insert(editing))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Video saved!')
    setModal(false); load()
  }

  async function del(id: string) {
    if (!confirm('Remove this video?')) return
    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (!error) { toast.success('Removed'); load() }
    else toast.error(error.message)
  }

  const inputCls = 'w-full bg-dark-900 border border-gold-500/20 rounded-sm px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/50 text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-cream">Videos</h2>
        <Button onClick={() => { setEditing(EMPTY); setModal(true) }} size="sm"><Plus size={14} />Add Video</Button>
      </div>

      {loading ? <div className="text-cream/40 text-sm">Loading...</div> : (
        <div className="space-y-2">
          {videos.map(v => (
            <div key={v.id} className="flex items-center gap-4 p-4 bg-dark-800 border border-gold-500/10 rounded-sm hover:border-gold-500/20 transition-colors">
              <div className="w-20 h-12 bg-dark-700 rounded-sm flex-shrink-0 overflow-hidden">
                <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {v.is_featured && <span className="text-xs text-gold-400/60 font-display uppercase tracking-wider">Featured</span>}
                  <span className="text-xs text-cream/30 font-display uppercase tracking-wider">{v.category.replace('_',' ')}</span>
                </div>
                <p className="font-medium text-cream text-sm truncate">{v.title}</p>
                <p className="text-xs text-cream/30">ID: {v.youtube_id}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href={`https://youtube.com/watch?v=${v.youtube_id}`} target="_blank" rel="noreferrer" className="text-cream/30 hover:text-gold-400 transition-colors p-1.5 text-xs">▶</a>
                <button onClick={() => { setEditing(v); setModal(true) }} className="text-cream/40 hover:text-gold-400 transition-colors p-1.5"><Edit2 size={15} /></button>
                <button onClick={() => del(v.id)} className="text-cream/40 hover:text-red-400 transition-colors p-1.5"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {videos.length === 0 && <p className="text-cream/40 text-sm py-8 text-center">No videos yet.</p>}
        </div>
      )}

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Edit Video' : 'Add Video'}>
        <div className="space-y-4">
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Title *</label>
            <input className={inputCls} value={editing.title ?? ''} onChange={e => setEditing(v => ({ ...v, title: e.target.value }))} placeholder="Last Night" /></div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">YouTube Video ID *</label>
            <input className={inputCls} value={editing.youtube_id ?? ''} onChange={e => setEditing(v => ({ ...v, youtube_id: e.target.value }))} placeholder="dQw4w9WgXcQ" />
            <p className="text-xs text-cream/30 mt-1">From the URL: youtube.com/watch?v=<strong>THIS_PART</strong></p></div>
          {editing.youtube_id && (
            <div className="aspect-video rounded-sm overflow-hidden">
              <img src={`https://img.youtube.com/vi/${editing.youtube_id}/mqdefault.jpg`} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Category</label>
              <select className={inputCls} value={editing.category ?? 'music_video'} onChange={e => setEditing(v => ({ ...v, category: e.target.value }))}>
                {['music_video','live','interview','behind_scenes','lyric_video','vlog'].map(c => <option key={c} value={c} className="bg-dark-800">{c.replace('_',' ')}</option>)}
              </select></div>
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Thumbnail (ImageKit)</label>
              <input className={inputCls} value={editing.imagekit_thumbnail ?? ''} onChange={e => setEditing(v => ({ ...v, imagekit_thumbnail: e.target.value }))} placeholder="videos/custom-thumb.jpg" /></div>
          </div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Description</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={editing.description ?? ''} onChange={e => setEditing(v => ({ ...v, description: e.target.value }))} /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editing.is_featured ?? false} onChange={e => setEditing(v => ({ ...v, is_featured: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
            <span className="text-cream/70 text-sm">Featured video</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} loading={saving} fullWidth>Save Video</Button>
            <Button variant="ghost" onClick={() => setModal(false)} fullWidth>Cancel</Button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

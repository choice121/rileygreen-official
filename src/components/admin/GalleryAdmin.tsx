import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import AdminModal from './AdminModal'
import Button from '../ui/Button'

type Photo = { id: string; title: string; imagekit_path: string; category: string; is_featured: boolean; sort_order: number }
const EMPTY: Partial<Photo> = { title: '', imagekit_path: '', category: 'general', is_featured: false, sort_order: 0 }

export default function GalleryAdmin() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Photo>>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('gallery_photos').select('*').order('sort_order').order('created_at', { ascending: false })
    if (data) setPhotos(data as Photo[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    let error
    if (editing.id) {
      ;({ error } = await supabase.from('gallery_photos').update(editing).eq('id', editing.id))
    } else {
      ;({ error } = await supabase.from('gallery_photos').insert(editing))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Photo saved!')
    setModal(false); load()
  }

  async function del(id: string) {
    if (!confirm('Remove this photo?')) return
    const { error } = await supabase.from('gallery_photos').delete().eq('id', id)
    if (!error) { toast.success('Removed'); load() }
    else toast.error(error.message)
  }

  const inputCls = 'w-full bg-dark-900 border border-gold-500/20 rounded-sm px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/50 text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-cream">Gallery</h2>
        <Button onClick={() => { setEditing(EMPTY); setModal(true) }} size="sm"><Plus size={14} />Add Photo</Button>
      </div>
      <p className="text-cream/40 text-xs mb-4">Upload photos to <a href="https://imagekit.io" target="_blank" rel="noreferrer" className="text-gold-400 hover:text-gold-300">ImageKit</a> first, then copy the path here.</p>

      {loading ? <div className="text-cream/40 text-sm">Loading...</div> : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map(p => (
            <div key={p.id} className="relative group aspect-square bg-dark-800 rounded-sm overflow-hidden border border-gold-500/10">
              <img src={`https://ik.imagekit.io/Morganwallen/${p.imagekit_path}?tr=w-300,h-300`} alt={p.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-dark-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-cream text-center px-2 truncate w-full text-center">{p.title}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(p); setModal(true) }} className="text-gold-400 hover:text-gold-300 transition-colors p-1 bg-dark-800/80 rounded">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => del(p.id)} className="text-red-400 hover:text-red-300 transition-colors p-1 bg-dark-800/80 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {p.is_featured && (
                <span className="absolute top-1 left-1 text-xs bg-gold-500/80 text-dark-900 px-1 py-0.5 rounded font-display uppercase leading-none">★</span>
              )}
            </div>
          ))}
          {photos.length === 0 && <p className="text-cream/40 text-sm py-8 text-center col-span-4">No photos yet.</p>}
        </div>
      )}

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Edit Photo' : 'Add Photo'} size="sm">
        <div className="space-y-4">
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">ImageKit Path *</label>
            <input className={inputCls} value={editing.imagekit_path ?? ''} onChange={e => setEditing(v => ({ ...v, imagekit_path: e.target.value }))} placeholder="gallery/photo-name.jpg" />
            <p className="text-xs text-cream/30 mt-1">e.g. gallery/concert-2025.jpg</p>
          </div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Title</label>
            <input className={inputCls} value={editing.title ?? ''} onChange={e => setEditing(v => ({ ...v, title: e.target.value }))} placeholder="Stage at Nashville" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Category</label>
              <select className={inputCls} value={editing.category ?? 'general'} onChange={e => setEditing(v => ({ ...v, category: e.target.value }))}>
                {['general','concert','backstage','personal','press'].map(c => <option key={c} value={c} className="bg-dark-800">{c}</option>)}
              </select></div>
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Sort Order</label>
              <input type="number" className={inputCls} value={editing.sort_order ?? 0} onChange={e => setEditing(v => ({ ...v, sort_order: Number(e.target.value) }))} /></div>
          </div>
          {editing.imagekit_path && (
            <div className="rounded-sm overflow-hidden aspect-video bg-dark-900">
              <img src={`https://ik.imagekit.io/Morganwallen/${editing.imagekit_path}?tr=w-400`} alt="Preview" className="w-full h-full object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editing.is_featured ?? false} onChange={e => setEditing(v => ({ ...v, is_featured: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
            <span className="text-cream/70 text-sm">Featured (shown prominently)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} loading={saving} fullWidth>Save Photo</Button>
            <Button variant="ghost" onClick={() => setModal(false)} fullWidth>Cancel</Button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

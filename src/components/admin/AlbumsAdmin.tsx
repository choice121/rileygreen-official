import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase, Album } from '../../lib/supabase'
import toast from 'react-hot-toast'
import AdminModal from './AdminModal'
import Button from '../ui/Button'

type Track = { id: string; album_id: string; title: string; track_number: number; duration: string; preview_url: string; is_single: boolean }
const EMPTY_ALBUM: Partial<Album> = { title: '', release_date: '', cover_image: '', spotify_url: '', apple_music_url: '', album_type: 'album', description: '' }
const EMPTY_TRACK: Partial<Track> = { title: '', track_number: 1, duration: '', preview_url: '', is_single: false }

export default function AlbumsAdmin() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [tracks, setTracks] = useState<Record<string, Track[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [albumModal, setAlbumModal] = useState(false)
  const [trackModal, setTrackModal] = useState(false)
  const [editAlbum, setEditAlbum] = useState<Partial<Album>>(EMPTY_ALBUM)
  const [editTrack, setEditTrack] = useState<Partial<Track>>(EMPTY_TRACK)
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('albums').select('*').order('release_date', { ascending: false })
    if (data) setAlbums(data as Album[])
    setLoading(false)
  }

  async function loadTracks(albumId: string) {
    const { data } = await supabase.from('tracks').select('*').eq('album_id', albumId).order('track_number')
    if (data) setTracks(t => ({ ...t, [albumId]: data as Track[] }))
  }

  useEffect(() => { load() }, [])

  async function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!tracks[id]) await loadTracks(id)
  }

  async function saveAlbum() {
    setSaving(true)
    let error
    if (editAlbum.id) {
      ;({ error } = await supabase.from('albums').update(editAlbum).eq('id', editAlbum.id))
    } else {
      ;({ error } = await supabase.from('albums').insert(editAlbum))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Album saved!')
    setAlbumModal(false); load()
  }

  async function saveTrack() {
    setSaving(true)
    const payload = { ...editTrack, album_id: activeAlbumId }
    let error
    if (editTrack.id) {
      ;({ error } = await supabase.from('tracks').update(payload).eq('id', editTrack.id))
    } else {
      ;({ error } = await supabase.from('tracks').insert(payload))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Track saved!')
    setTrackModal(false)
    if (activeAlbumId) loadTracks(activeAlbumId)
  }

  async function delAlbum(id: string) {
    if (!confirm('Delete album and all its tracks?')) return
    await supabase.from('tracks').delete().eq('album_id', id)
    const { error } = await supabase.from('albums').delete().eq('id', id)
    if (!error) { toast.success('Album deleted'); load() }
    else toast.error(error.message)
  }

  async function delTrack(id: string, albumId: string) {
    if (!confirm('Delete this track?')) return
    const { error } = await supabase.from('tracks').delete().eq('id', id)
    if (!error) { toast.success('Track deleted'); loadTracks(albumId) }
    else toast.error(error.message)
  }

  const inputCls = 'w-full bg-dark-900 border border-gold-500/20 rounded-sm px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/50 text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-cream">Albums & Music</h2>
        <Button onClick={() => { setEditAlbum(EMPTY_ALBUM); setAlbumModal(true) }} size="sm"><Plus size={14} />New Album</Button>
      </div>

      {loading ? <div className="text-cream/40 text-sm">Loading...</div> : (
        <div className="space-y-2">
          {albums.map(a => (
            <div key={a.id} className="bg-dark-800 border border-gold-500/10 rounded-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <button onClick={() => toggleExpand(a.id)} className="text-cream/40 hover:text-gold-400 transition-colors">
                  {expanded === a.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-cream">{a.title}</p>
                  <p className="text-xs text-cream/40">{a.release_date} · {a.album_type}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditAlbum(a); setAlbumModal(true) }} className="text-cream/40 hover:text-gold-400 transition-colors p-1.5"><Edit2 size={15} /></button>
                  <button onClick={() => delAlbum(a.id)} className="text-cream/40 hover:text-red-400 transition-colors p-1.5"><Trash2 size={15} /></button>
                </div>
              </div>
              {expanded === a.id && (
                <div className="border-t border-gold-500/10 p-4 bg-dark-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-cream/40 uppercase tracking-wider font-display">Tracks</span>
                    <button onClick={() => { setEditTrack(EMPTY_TRACK); setActiveAlbumId(a.id); setTrackModal(true) }}
                      className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors">
                      <Plus size={12} /> Add Track
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(tracks[a.id] ?? []).map(t => (
                      <div key={t.id} className="flex items-center gap-3 py-1.5">
                        <span className="text-cream/30 text-xs w-5 text-right">{t.track_number}</span>
                        <span className="flex-1 text-cream/80 text-sm">{t.title}</span>
                        {t.is_single && <span className="text-xs text-gold-400/60 font-display uppercase">Single</span>}
                        <span className="text-cream/30 text-xs">{t.duration}</span>
                        <button onClick={() => { setEditTrack(t); setActiveAlbumId(a.id); setTrackModal(true) }} className="text-cream/30 hover:text-gold-400 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => delTrack(t.id, a.id)} className="text-cream/30 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    ))}
                    {!(tracks[a.id]?.length) && <p className="text-cream/30 text-xs py-2">No tracks yet.</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {albums.length === 0 && <p className="text-cream/40 text-sm py-8 text-center">No albums yet.</p>}
        </div>
      )}

      <AdminModal open={albumModal} onClose={() => setAlbumModal(false)} title={editAlbum.id ? 'Edit Album' : 'New Album'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Title *</label>
              <input className={inputCls} value={editAlbum.title ?? ''} onChange={e => setEditAlbum(v => ({ ...v, title: e.target.value }))} /></div>
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Release Date</label>
              <input type="date" className={inputCls} value={editAlbum.release_date ?? ''} onChange={e => setEditAlbum(v => ({ ...v, release_date: e.target.value }))} /></div>
          </div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Type</label>
            <select className={inputCls} value={editAlbum.album_type ?? 'album'} onChange={e => setEditAlbum(v => ({ ...v, album_type: e.target.value }))}>
              {['album','ep','single','deluxe'].map(t => <option key={t} value={t} className="bg-dark-800">{t}</option>)}
            </select></div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Cover Image (ImageKit path)</label>
            <input className={inputCls} value={editAlbum.cover_image ?? ''} onChange={e => setEditAlbum(v => ({ ...v, cover_image: e.target.value }))} placeholder="albums/cover.jpg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Spotify URL</label>
              <input className={inputCls} value={editAlbum.spotify_url ?? ''} onChange={e => setEditAlbum(v => ({ ...v, spotify_url: e.target.value }))} placeholder="https://open.spotify.com/..." /></div>
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Apple Music URL</label>
              <input className={inputCls} value={editAlbum.apple_music_url ?? ''} onChange={e => setEditAlbum(v => ({ ...v, apple_music_url: e.target.value }))} placeholder="https://music.apple.com/..." /></div>
          </div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Description</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={editAlbum.description ?? ''} onChange={e => setEditAlbum(v => ({ ...v, description: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <Button onClick={saveAlbum} loading={saving} fullWidth>Save Album</Button>
            <Button variant="ghost" onClick={() => setAlbumModal(false)} fullWidth>Cancel</Button>
          </div>
        </div>
      </AdminModal>

      <AdminModal open={trackModal} onClose={() => setTrackModal(false)} title={editTrack.id ? 'Edit Track' : 'Add Track'} size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Track # </label>
              <input type="number" className={inputCls} value={editTrack.track_number ?? 1} onChange={e => setEditTrack(v => ({ ...v, track_number: Number(e.target.value) }))} /></div>
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Duration</label>
              <input className={inputCls} value={editTrack.duration ?? ''} onChange={e => setEditTrack(v => ({ ...v, duration: e.target.value }))} placeholder="3:42" /></div>
          </div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Title *</label>
            <input className={inputCls} value={editTrack.title ?? ''} onChange={e => setEditTrack(v => ({ ...v, title: e.target.value }))} /></div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Preview URL (30s MP3)</label>
            <input className={inputCls} value={editTrack.preview_url ?? ''} onChange={e => setEditTrack(v => ({ ...v, preview_url: e.target.value }))} placeholder="https://..." /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editTrack.is_single ?? false} onChange={e => setEditTrack(v => ({ ...v, is_single: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
            <span className="text-cream/70 text-sm">This is a single</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button onClick={saveTrack} loading={saving} fullWidth>Save Track</Button>
            <Button variant="ghost" onClick={() => setTrackModal(false)} fullWidth>Cancel</Button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

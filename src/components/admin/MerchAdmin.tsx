import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import AdminModal from './AdminModal'
import Button from '../ui/Button'

type MerchItem = { id: string; name: string; description: string; price: number; image: string; category: string; shopify_url: string; is_featured: boolean; is_sold_out: boolean; sizes: string[] }
const EMPTY: Partial<MerchItem> = { name: '', description: '', price: 0, image: '', category: 'apparel', shopify_url: '', is_featured: false, is_sold_out: false, sizes: [] }

export default function MerchAdmin() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<MerchItem>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [sizesInput, setSizesInput] = useState('')

  async function load() {
    const { data } = await supabase.from('merch_items').select('*').order('created_at', { ascending: false })
    if (data) setItems(data as MerchItem[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(EMPTY); setSizesInput(''); setModal(true) }
  function openEdit(m: MerchItem) {
    setEditing(m)
    setSizesInput((m.sizes ?? []).join(', '))
    setModal(true)
  }

  async function save() {
    setSaving(true)
    const payload = { ...editing, sizes: sizesInput.split(',').map(s => s.trim()).filter(Boolean) }
    let error
    if (editing.id) {
      ;({ error } = await supabase.from('merch_items').update(payload).eq('id', editing.id))
    } else {
      ;({ error } = await supabase.from('merch_items').insert(payload))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing.id ? 'Item updated!' : 'Item added!')
    setModal(false); load()
  }

  async function del(id: string) {
    if (!confirm('Remove this item?')) return
    const { error } = await supabase.from('merch_items').delete().eq('id', id)
    if (!error) { toast.success('Removed'); load() }
    else toast.error(error.message)
  }

  const inputCls = 'w-full bg-dark-900 border border-gold-500/20 rounded-sm px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/50 text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-cream">Merch</h2>
        <Button onClick={openNew} size="sm"><Plus size={14} />Add Item</Button>
      </div>

      {loading ? <div className="text-cream/40 text-sm">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(m => (
            <div key={m.id} className="flex gap-3 p-4 bg-dark-800 border border-gold-500/10 rounded-sm hover:border-gold-500/20 transition-colors">
              <div className="w-16 h-16 bg-dark-700 rounded-sm flex-shrink-0 overflow-hidden">
                {m.image && <img src={`https://ik.imagekit.io/Morganwallen/${m.image}`} alt={m.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-cream text-sm">{m.name}</p>
                  <span className="text-gold-400 font-semibold text-sm flex-shrink-0">${Number(m.price).toFixed(2)}</span>
                </div>
                <p className="text-xs text-cream/40 capitalize">{m.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  {m.is_featured && <span className="text-xs bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded font-display uppercase">Featured</span>}
                  {m.is_sold_out && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-display uppercase">Sold Out</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => openEdit(m)} className="text-cream/40 hover:text-gold-400 transition-colors p-1"><Edit2 size={15} /></button>
                <button onClick={() => del(m.id)} className="text-cream/40 hover:text-red-400 transition-colors p-1"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-cream/40 text-sm py-8 text-center col-span-2">No merch items yet.</p>}
        </div>
      )}

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Edit Item' : 'Add Merch Item'}>
        <div className="space-y-4">
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Name *</label>
            <input className={inputCls} value={editing.name ?? ''} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} placeholder="One Thing At A Time Tee" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Price ($)</label>
              <input type="number" step="0.01" className={inputCls} value={editing.price ?? 0} onChange={e => setEditing(v => ({ ...v, price: parseFloat(e.target.value) }))} /></div>
            <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Category</label>
              <select className={inputCls} value={editing.category ?? 'apparel'} onChange={e => setEditing(v => ({ ...v, category: e.target.value }))}>
                {['apparel','accessories','vinyl','poster','bundle','hat'].map(c => <option key={c} value={c} className="bg-dark-800">{c}</option>)}
              </select></div>
          </div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Image (ImageKit path)</label>
            <input className={inputCls} value={editing.image ?? ''} onChange={e => setEditing(v => ({ ...v, image: e.target.value }))} placeholder="merch/tee-front.jpg" /></div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Sizes (comma-separated)</label>
            <input className={inputCls} value={sizesInput} onChange={e => setSizesInput(e.target.value)} placeholder="S, M, L, XL, 2XL" /></div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Shop URL</label>
            <input className={inputCls} value={editing.shopify_url ?? ''} onChange={e => setEditing(v => ({ ...v, shopify_url: e.target.value }))} placeholder="https://store.rileygreen.com/..." /></div>
          <div><label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Description</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={editing.description ?? ''} onChange={e => setEditing(v => ({ ...v, description: e.target.value }))} /></div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.is_featured ?? false} onChange={e => setEditing(v => ({ ...v, is_featured: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
              <span className="text-cream/70 text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.is_sold_out ?? false} onChange={e => setEditing(v => ({ ...v, is_sold_out: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
              <span className="text-cream/70 text-sm">Sold Out</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} loading={saving} fullWidth>Save Item</Button>
            <Button variant="ghost" onClick={() => setModal(false)} fullWidth>Cancel</Button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

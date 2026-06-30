import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { supabase, TourDate } from '../../lib/supabase'
import toast from 'react-hot-toast'
import AdminModal from './AdminModal'
import Button from '../ui/Button'
import { format } from 'date-fns'

const EMPTY: Partial<TourDate> = { event_date: '', event_time: '7:00 PM', city: '', state: '', country: 'USA', venue: '', ticket_url: '', is_sold_out: false, is_cancelled: false }

export default function TourAdmin() {
  const [dates, setDates] = useState<TourDate[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<TourDate>>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('tour_dates').select('*').order('event_date', { ascending: true })
    if (data) setDates(data as TourDate[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(EMPTY); setModal(true) }
  function openEdit(d: TourDate) { setEditing(d); setModal(true) }

  async function save() {
    setSaving(true)
    let error
    if (editing.id) {
      ;({ error } = await supabase.from('tour_dates').update(editing).eq('id', editing.id))
    } else {
      ;({ error } = await supabase.from('tour_dates').insert(editing))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing.id ? 'Show updated!' : 'Show added!')
    setModal(false); load()
  }

  async function del(id: string) {
    if (!confirm('Remove this show?')) return
    const { error } = await supabase.from('tour_dates').delete().eq('id', id)
    if (!error) { toast.success('Removed'); load() }
    else toast.error(error.message)
  }

  const inputCls = 'w-full bg-dark-900 border border-gold-500/20 rounded-sm px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/50 text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-cream">Tour Dates</h2>
        <Button onClick={openNew} size="sm"><Plus size={14} />Add Show</Button>
      </div>

      {loading ? <div className="text-cream/40 text-sm">Loading...</div> : (
        <div className="space-y-2">
          {dates.map(d => (
            <div key={d.id} className={`flex items-center gap-4 p-4 bg-dark-800 border rounded-sm transition-colors ${d.is_cancelled ? 'border-red-500/20 opacity-60' : 'border-gold-500/10 hover:border-gold-500/20'}`}>
              <div className="w-14 text-center flex-shrink-0">
                <div className="text-gold-400 font-display font-black text-xl leading-none">{format(new Date(d.event_date + 'T00:00:00'), 'dd')}</div>
                <div className="text-cream/50 text-xs uppercase tracking-widest">{format(new Date(d.event_date + 'T00:00:00'), 'MMM yy')}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-cream">{d.city}{d.state ? `, ${d.state}` : ''}</p>
                <p className="text-sm text-cream/50">{d.venue} · {d.event_time}</p>
              </div>
              <div className="flex items-center gap-2">
                {d.is_sold_out && <span className="text-xs text-red-400 font-display uppercase tracking-wider">Sold Out</span>}
                {d.is_cancelled && <span className="text-xs text-red-400 font-display uppercase tracking-wider">Cancelled</span>}
                <button onClick={() => openEdit(d)} className="text-cream/40 hover:text-gold-400 transition-colors p-1.5"><Edit2 size={16} /></button>
                <button onClick={() => del(d.id)} className="text-cream/40 hover:text-red-400 transition-colors p-1.5"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {dates.length === 0 && <p className="text-cream/40 text-sm py-8 text-center">No shows yet.</p>}
        </div>
      )}

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing.id ? 'Edit Show' : 'Add Show'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Date *</label>
              <input type="date" className={inputCls} value={editing.event_date ?? ''} onChange={e => setEditing(v => ({ ...v, event_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Time</label>
              <input className={inputCls} value={editing.event_time ?? ''} onChange={e => setEditing(v => ({ ...v, event_time: e.target.value }))} placeholder="7:00 PM" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">City *</label>
              <input className={inputCls} value={editing.city ?? ''} onChange={e => setEditing(v => ({ ...v, city: e.target.value }))} placeholder="Nashville" />
            </div>
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">State</label>
              <input className={inputCls} value={editing.state ?? ''} onChange={e => setEditing(v => ({ ...v, state: e.target.value }))} placeholder="TN" />
            </div>
            <div>
              <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Country</label>
              <input className={inputCls} value={editing.country ?? 'USA'} onChange={e => setEditing(v => ({ ...v, country: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Venue *</label>
            <input className={inputCls} value={editing.venue ?? ''} onChange={e => setEditing(v => ({ ...v, venue: e.target.value }))} placeholder="Nissan Stadium" />
          </div>
          <div>
            <label className="block text-xs text-cream/50 uppercase tracking-wider mb-1">Ticket URL</label>
            <input className={inputCls} value={editing.ticket_url ?? ''} onChange={e => setEditing(v => ({ ...v, ticket_url: e.target.value }))} placeholder="https://ticketmaster.com/..." />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.is_sold_out ?? false} onChange={e => setEditing(v => ({ ...v, is_sold_out: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
              <span className="text-cream/70 text-sm">Sold Out</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.is_cancelled ?? false} onChange={e => setEditing(v => ({ ...v, is_cancelled: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
              <span className="text-cream/70 text-sm">Cancelled</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} loading={saving} fullWidth>Save Show</Button>
            <Button variant="ghost" onClick={() => setModal(false)} fullWidth>Cancel</Button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

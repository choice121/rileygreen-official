import { useEffect, useState } from 'react'
import { Download, Mail, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

type Sub = { id: string; email: string; name: string; subscribed_at: string; is_active: boolean }

export default function SubscribersAdmin() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })
    if (data) setSubs(data as Sub[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function exportCSV() {
    const header = 'Email,Name,Subscribed,Active'
    const rows = subs.map(s => `${s.email},${s.name ?? ''},${s.subscribed_at},${s.is_active}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  async function del(id: string) {
    if (!confirm('Remove this subscriber?')) return
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id)
    if (!error) { toast.success('Removed'); load() }
    else toast.error(error.message)
  }

  const active = subs.filter(s => s.is_active)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl text-cream">Newsletter Subscribers</h2>
          <p className="text-cream/40 text-sm mt-1">{active.length} active · {subs.length} total</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300 transition-colors border border-gold-500/20 px-3 py-1.5 rounded-sm hover:border-gold-500/40">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {loading ? <div className="text-cream/40 text-sm">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold-500/10">
                <th className="text-left py-3 px-3 text-cream/40 font-display text-xs uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-3 text-cream/40 font-display text-xs uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-3 text-cream/40 font-display text-xs uppercase tracking-wider">Subscribed</th>
                <th className="text-left py-3 px-3 text-cream/40 font-display text-xs uppercase tracking-wider">Status</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id} className="border-b border-gold-500/5 hover:bg-dark-800/50 transition-colors">
                  <td className="py-3 px-3 text-cream flex items-center gap-2"><Mail size={13} className="text-gold-400/50 flex-shrink-0" />{s.email}</td>
                  <td className="py-3 px-3 text-cream/60">{s.name || '—'}</td>
                  <td className="py-3 px-3 text-cream/40">{s.subscribed_at ? format(new Date(s.subscribed_at), 'MMM d, yyyy') : '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-display uppercase ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-cream/30'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button onClick={() => del(s.id)} className="text-cream/30 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-cream/40">No subscribers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

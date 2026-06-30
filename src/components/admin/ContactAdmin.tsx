import { useEffect, useState } from 'react'
import { Mail, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

type Submission = { id: string; name: string; email: string; subject: string; message: string; is_read: boolean; created_at: string }

export default function ContactAdmin() {
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false })
    if (data) setItems(data as Submission[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function markRead(id: string, current: boolean) {
    await supabase.from('contact_submissions').update({ is_read: !current }).eq('id', id)
    load()
  }

  async function del(id: string) {
    if (!confirm('Delete this message?')) return
    const { error } = await supabase.from('contact_submissions').delete().eq('id', id)
    if (!error) { toast.success('Deleted'); load() }
    else toast.error(error.message)
  }

  const unread = items.filter(i => !i.is_read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl text-cream">Contact Submissions</h2>
          {unread > 0 && <p className="text-gold-400 text-sm mt-1">{unread} unread message{unread > 1 ? 's' : ''}</p>}
        </div>
      </div>

      {loading ? <div className="text-cream/40 text-sm">Loading...</div> : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`border rounded-sm transition-all ${item.is_read ? 'border-gold-500/5 bg-dark-800/50' : 'border-gold-500/20 bg-dark-800'}`}>
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => { setExpanded(expanded === item.id ? null : item.id); if (!item.is_read) markRead(item.id, false) }}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.is_read ? 'bg-dark-600' : 'bg-gold-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-cream text-sm">{item.name}</span>
                    <span className="text-cream/30 text-xs">{item.email}</span>
                  </div>
                  <p className="text-cream/60 text-sm truncate">{item.subject}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-cream/30 text-xs">{item.created_at ? format(new Date(item.created_at), 'MMM d') : ''}</span>
                  {expanded === item.id ? <ChevronUp size={15} className="text-cream/40" /> : <ChevronDown size={15} className="text-cream/40" />}
                </div>
              </div>
              {expanded === item.id && (
                <div className="px-4 pb-4 border-t border-gold-500/10">
                  <div className="mt-3 mb-3 flex items-center gap-2 text-xs text-cream/40">
                    <Mail size={12} />
                    <a href={`mailto:${item.email}`} className="hover:text-gold-400 transition-colors">{item.email}</a>
                    <span>·</span>
                    <span>{item.created_at ? format(new Date(item.created_at), 'MMMM d, yyyy h:mm a') : ''}</span>
                  </div>
                  <p className="text-cream/80 text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <a href={`mailto:${item.email}?subject=Re: ${item.subject}`}
                      className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors border border-gold-500/20 px-3 py-1.5 rounded-sm hover:border-gold-500/40">
                      <Mail size={12} /> Reply
                    </a>
                    <button onClick={() => markRead(item.id, item.is_read)}
                      className="flex items-center gap-1.5 text-xs text-cream/40 hover:text-cream transition-colors">
                      <Check size={12} /> {item.is_read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button onClick={() => del(item.id)} className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors ml-auto">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <p className="text-cream/40 text-sm py-8 text-center">No contact submissions yet.</p>}
        </div>
      )}
    </div>
  )
}

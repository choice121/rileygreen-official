import { useEffect, useState } from 'react'
import { Music, Calendar, Newspaper, ShoppingBag, Image, Video, Mail, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATS = [
  { key: 'albums', label: 'Albums', icon: Music, table: 'albums' },
  { key: 'tour_dates', label: 'Tour Dates', icon: Calendar, table: 'tour_dates' },
  { key: 'news_posts', label: 'News Posts', icon: Newspaper, table: 'news_posts' },
  { key: 'merch_items', label: 'Merch Items', icon: ShoppingBag, table: 'merch_items' },
  { key: 'gallery_photos', label: 'Gallery Photos', icon: Image, table: 'gallery_photos' },
  { key: 'videos', label: 'Videos', icon: Video, table: 'videos' },
  { key: 'newsletter_subscribers', label: 'Subscribers', icon: Mail, table: 'newsletter_subscribers' },
  { key: 'contact_submissions', label: 'Contact Msgs', icon: MessageSquare, table: 'contact_submissions' },
]

export default function DashboardOverview() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all(
      STATS.map(async s => {
        const { count } = await supabase.from(s.table).select('*', { count: 'exact', head: true })
        return [s.key, count ?? 0]
      })
    ).then(results => setCounts(Object.fromEntries(results)))
  }, [])

  return (
    <div>
      <h2 className="font-serif text-2xl text-cream mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="bg-dark-800 border border-gold-500/10 rounded-sm p-5 hover:border-gold-500/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Icon size={18} className="text-gold-400" />
              <span className="text-3xl font-display font-bold text-cream">{counts[key] ?? '—'}</span>
            </div>
            <p className="text-cream/50 text-xs font-display uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-dark-800 border border-gold-500/10 rounded-sm">
        <h3 className="font-serif text-lg text-cream mb-3">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <a href="https://supabase.com/dashboard/project/yxspomuwawzsnsjpqxid/editor" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors">
            → Supabase Editor
          </a>
          <a href="https://imagekit.io" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors">
            → ImageKit Upload
          </a>
          <a href="https://github.com/choice121/rileygreen-official" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors">
            → GitHub Repo
          </a>
          <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors">
            → Cloudflare
          </a>
        </div>
      </div>
    </div>
  )
}

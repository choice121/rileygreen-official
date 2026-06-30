import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Youtube } from 'lucide-react'
import { supabase, Video } from '../lib/supabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const THUMBS = [
  'https://images.unsplash.com/photo-1598387993441-a364f854cfbf?w=800&h=450&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=450&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1501386761578-eaa54b620fe8?w=800&h=450&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop&auto=format',
]
const CATEGORIES_V = ['all', 'music-video', 'live', 'behind-the-scenes']

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    const q = supabase.from('videos').select('*').eq('is_published', true).order('published_at', { ascending: false })
    if (catFilter !== 'all') q.eq('category', catFilter)
    q.then(({ data }) => {
      if (data) setVideos(data as Video[])
      setLoading(false)
    })
  }, [catFilter])

  return (
    <div className="min-h-screen bg-dark-800 pt-24">
      <div className="py-20 px-4 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <p className="section-subtitle mb-4">Watch</p>
          <h1 className="section-title">Videos</h1>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-xl">
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES_V.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-4 py-2 text-xs font-display uppercase tracking-widest rounded-sm transition-all ${
                  catFilter === cat ? 'bg-gold-500 text-dark-900' : 'border border-gold-500/20 text-cream/50 hover:border-gold-500/40'
                }`}
              >
                {cat.replace('-', ' ')}
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`group relative rounded-sm overflow-hidden card-hover cursor-pointer gold-border ${i === 0 ? 'md:col-span-2' : ''}`}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={THUMBS[i % THUMBS.length]}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-dark-900/40 group-hover:bg-dark-900/20 transition-colors flex items-center justify-center">
                      <a
                        href={video.youtube_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="w-16 h-16 rounded-full bg-gold-500/90 backdrop-blur flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform"
                        onClick={e => e.stopPropagation()}
                      >
                        <Play size={22} className="text-dark-900 ml-1" fill="currentColor" />
                      </a>
                    </div>
                    <div className="absolute top-3 right-3 bg-dark-900/80 text-xs font-display uppercase tracking-wider px-2 py-1 flex items-center gap-1 rounded text-cream/70">
                      <Youtube size={11} className="text-red-500" />
                      {video.category === 'live' ? 'Live' : video.category === 'music-video' ? 'Music Video' : video.category}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-900 to-transparent">
                      <h3 className="font-serif text-cream font-semibold">{video.title}</h3>
                      {video.description && <p className="text-cream/50 text-sm mt-1 line-clamp-1">{video.description}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
              {videos.length === 0 && (
                <div className="col-span-3 text-center py-20 text-cream/40">
                  <Youtube size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-serif text-xl">No videos in this category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

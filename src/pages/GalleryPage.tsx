import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, GalleryPhoto } from '../lib/supabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const UNSPLASH = [
  'https://images.unsplash.com/photo-1501386761578-eaa54b620fe8?w=800&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1598387993441-a364f854cfbf?w=800&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=800&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop&auto=format',
]
const CATEGORIES = ['all', 'live', 'studio', 'backstage', 'fans', 'press']

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    const q = supabase.from('gallery_photos').select('*').eq('is_published', true).order('sort_order')
    if (catFilter !== 'all') q.eq('category', catFilter)
    q.then(({ data }) => {
      if (data) setPhotos(data as GalleryPhoto[])
      setLoading(false)
    })
  }, [catFilter])

  function prev() { setLightbox(l => l !== null ? (l - 1 + photos.length) % photos.length : null) }
  function next() { setLightbox(l => l !== null ? (l + 1) % photos.length : null) }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox === null) return
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, photos.length])

  return (
    <div className="min-h-screen bg-dark-900 pt-24">
      <div className="py-20 px-4 bg-dark-800">
        <div className="max-w-7xl mx-auto">
          <p className="section-subtitle mb-4">Behind the Lens</p>
          <h1 className="section-title">Gallery</h1>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-xl">
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-4 py-2 text-xs font-display uppercase tracking-widest rounded-sm transition-all ${
                  catFilter === cat ? 'bg-gold-500 text-dark-900' : 'border border-gold-500/20 text-cream/50 hover:border-gold-500/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(photos.length ? photos : Array(8).fill(null)).map((photo, i) => (
                <motion.div
                  key={photo?.id ?? i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => photo && setLightbox(i)}
                  className={`group relative overflow-hidden rounded-sm cursor-pointer ${
                    i % 7 === 0 ? 'col-span-2 row-span-2' : ''
                  }`}
                  style={{ aspectRatio: i % 7 === 0 ? '1/1' : '4/3' }}
                >
                  <img
                    src={UNSPLASH[i % UNSPLASH.length]}
                    alt={photo?.title ?? ''}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-dark-900/0 group-hover:bg-dark-900/40 transition-colors duration-300 flex items-end p-3">
                    {photo?.title && (
                      <p className="text-cream text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">{photo.title}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark-900/95 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-dark-700 border border-gold-500/20 flex items-center justify-center text-cream hover:text-gold-400 transition-colors z-10">
              <ChevronLeft size={20} />
            </button>
            <img
              src={UNSPLASH[lightbox % UNSPLASH.length]}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-sm shadow-gold-lg"
              onClick={e => e.stopPropagation()}
            />
            <button onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-dark-700 border border-gold-500/20 flex items-center justify-center text-cream hover:text-gold-400 transition-colors z-10">
              <ChevronRight size={20} />
            </button>
            <button onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-dark-700 border border-gold-500/20 flex items-center justify-center text-cream hover:text-gold-400 transition-colors">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

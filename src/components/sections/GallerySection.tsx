import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, GalleryPhoto } from '../../lib/supabase'
import { PLACEHOLDER_IMAGES } from '../../lib/imagekit'
import SectionHeader from '../ui/SectionHeader'

const UNSPLASH_GALLERY = [
  'https://images.unsplash.com/photo-1501386761578-eaa54b620fe8?w=600&h=800&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1598387993441-a364f854cfbf?w=600&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=600&h=400&fit=crop&auto=format',
]

export default function GallerySection() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])

  useEffect(() => {
    supabase
      .from('gallery_photos')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(({ data }) => { if (data) setPhotos(data as GalleryPhoto[]) })
  }, [])

  const items = photos.length ? photos : Array(6).fill(null)

  return (
    <section className="section-padding bg-dark-900">
      <div className="container-xl">
        <SectionHeader subtitle="Behind the Scenes" title="Gallery" />

        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((photo, i) => (
            <motion.div
              key={photo?.id ?? i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className={`group relative overflow-hidden rounded-sm cursor-pointer ${
                i === 0 ? 'row-span-2 col-span-1' : ''
              }`}
              style={{ aspectRatio: i === 0 ? '3/4' : '4/3' }}
            >
              <img
                src={UNSPLASH_GALLERY[i % UNSPLASH_GALLERY.length]}
                alt={photo?.title ?? `Photo ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-dark-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                {photo?.title && (
                  <p className="text-cream text-sm font-medium">{photo.title}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link to="/gallery" className="btn-outline">View Full Gallery</Link>
        </motion.div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Youtube } from 'lucide-react'
import { supabase, Video } from '../../lib/supabase'
import { PLACEHOLDER_IMAGES } from '../../lib/imagekit'
import SectionHeader from '../ui/SectionHeader'

const THUMBS = [
  'https://images.unsplash.com/photo-1598387993441-a364f854cfbf?w=800&h=450&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=450&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1501386761578-eaa54b620fe8?w=800&h=450&fit=crop&auto=format',
]

export default function VideosSection() {
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    supabase
      .from('videos')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setVideos(data as Video[]) })
  }, [])

  return (
    <section className="section-padding bg-dark-700">
      <div className="container-xl">
        <SectionHeader subtitle="Watch" title="Videos" />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {(videos.length ? videos : Array(3).fill(null)).map((video, i) => (
            <motion.div
              key={video?.id ?? i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`group relative rounded-sm overflow-hidden card-hover cursor-pointer ${i === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className={`relative overflow-hidden ${i === 0 ? 'aspect-video' : 'aspect-video'}`}>
                <img
                  src={THUMBS[i % THUMBS.length]}
                  alt={video?.title ?? 'Video'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-dark-900/50 group-hover:bg-dark-900/30 transition-colors duration-300 flex items-center justify-center">
                  <a
                    href={video?.youtube_url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-16 h-16 rounded-full bg-gold-500/90 backdrop-blur flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform duration-300"
                  >
                    <Play size={24} className="text-dark-900 ml-1" fill="currentColor" />
                  </a>
                </div>
                {video && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-dark-900/80 text-cream/70 text-xs font-display uppercase tracking-wider px-2 py-1 flex items-center gap-1 rounded">
                      <Youtube size={12} className="text-red-500" />
                      {video.category === 'live' ? 'Live' : 'Music Video'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-900 to-transparent">
                  {video ? (
                    <h3 className="font-serif text-cream font-semibold text-sm md:text-base">{video.title}</h3>
                  ) : (
                    <div className="h-5 bg-dark-600/50 rounded animate-pulse w-3/4" />
                  )}
                </div>
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
          <Link to="/videos" className="btn-outline">All Videos</Link>
        </motion.div>
      </div>
    </section>
  )
}

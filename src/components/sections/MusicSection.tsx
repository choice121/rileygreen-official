import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Music } from 'lucide-react'
import { supabase, Album } from '../../lib/supabase'
import { PLACEHOLDER_IMAGES } from '../../lib/imagekit'
import SectionHeader from '../ui/SectionHeader'

export default function MusicSection() {
  const [albums, setAlbums] = useState<Album[]>([])

  useEffect(() => {
    supabase
      .from('albums')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setAlbums(data as Album[]) })
  }, [])

  return (
    <section id="music-section" className="section-padding bg-dark-800">
      <div className="container-xl">
        <SectionHeader subtitle="Discography" title="Latest Music" description="Three studio albums of authentic country storytelling." />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {(albums.length ? albums : Array(3).fill(null)).map((album, i) => (
            <motion.div
              key={album?.id ?? i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="group relative overflow-hidden rounded-sm bg-dark-700 card-hover cursor-pointer"
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={PLACEHOLDER_IMAGES.album}
                  alt={album?.title ?? 'Album'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center shadow-gold">
                    <Play size={24} className="text-dark-900 ml-1" fill="currentColor" />
                  </div>
                </div>
                {i === 0 && (
                  <div className="absolute top-3 left-3 bg-gold-500 text-dark-900 text-xs font-display font-bold uppercase tracking-widest px-2 py-1">
                    Latest
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-gold-400/70 text-xs font-display uppercase tracking-widest mb-1">
                  {album?.release_date ? new Date(album.release_date).getFullYear() : '—'}
                </p>
                <h3 className="font-serif text-xl font-semibold text-cream group-hover:text-gold-400 transition-colors">
                  {album?.title ?? 'Loading...'}
                </h3>
                <p className="mt-2 text-cream/50 text-sm line-clamp-2">{album?.description ?? ''}</p>
                <div className="mt-4 flex gap-3">
                  {album?.spotify_url && (
                    <a href={album.spotify_url} target="_blank" rel="noreferrer"
                      className="text-xs text-cream/50 hover:text-green-400 transition-colors font-display uppercase tracking-wider">
                      Spotify
                    </a>
                  )}
                  {album?.apple_music_url && (
                    <a href={album.apple_music_url} target="_blank" rel="noreferrer"
                      className="text-xs text-cream/50 hover:text-pink-400 transition-colors font-display uppercase tracking-wider">
                      Apple Music
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link to="/music" className="btn-outline inline-flex items-center gap-2">
            <Music size={16} />
            Full Discography
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

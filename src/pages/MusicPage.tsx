import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Music, ExternalLink } from 'lucide-react'
import { supabase, Album, Track } from '../lib/supabase'
import { PLACEHOLDER_IMAGES } from '../lib/imagekit'
import { format } from 'date-fns'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function MusicPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [tracks, setTracks] = useState<Record<string, Track[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('albums')
      .select('*')
      .order('release_date', { ascending: false })
      .then(({ data }) => {
        if (data) setAlbums(data as Album[])
        setLoading(false)
      })
  }, [])

  async function loadTracks(albumId: string) {
    if (tracks[albumId]) {
      setExpanded(expanded === albumId ? null : albumId)
      return
    }
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .eq('album_id', albumId)
      .order('track_number', { ascending: true })
    if (data) setTracks(prev => ({ ...prev, [albumId]: data as Track[] }))
    setExpanded(albumId)
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '--:--'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-dark-800 pt-24">
      {/* Page header */}
      <div className="relative py-20 px-4 bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={PLACEHOLDER_IMAGES.hero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-dark-900/70" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <p className="section-subtitle mb-4">Discography</p>
          <h1 className="section-title">Music</h1>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-xl">
          {loading ? <LoadingSpinner /> : (
            <div className="space-y-16">
              {albums.map((album, i) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                  {/* Album art */}
                  <div className="md:col-span-1">
                    <div className="relative aspect-square rounded-sm overflow-hidden shadow-card group">
                      <img
                        src={PLACEHOLDER_IMAGES.album}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {i === 0 && (
                        <div className="absolute top-3 left-3 bg-gold-500 text-dark-900 text-xs font-display uppercase tracking-widest px-2 py-1 font-bold">
                          Latest
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-3">
                      {album.spotify_url && (
                        <a href={album.spotify_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-cream/50 hover:text-green-400 transition-colors font-display uppercase tracking-wider">
                          <Music size={14} /> Spotify
                        </a>
                      )}
                      {album.apple_music_url && (
                        <a href={album.apple_music_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-cream/50 hover:text-pink-400 transition-colors font-display uppercase tracking-wider">
                          <ExternalLink size={12} /> Apple Music
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Album info */}
                  <div className="md:col-span-2">
                    <p className="text-gold-400/70 text-xs font-display uppercase tracking-widest mb-2">
                      {album.release_date ? format(new Date(album.release_date + 'T00:00:00'), 'MMMM d, yyyy') : 'Album'}
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-cream">{album.title}</h2>
                    {album.description && (
                      <p className="mt-4 text-cream/60 leading-relaxed">{album.description}</p>
                    )}

                    <button
                      onClick={() => loadTracks(album.id)}
                      className="mt-6 flex items-center gap-2 text-gold-400 text-sm font-display uppercase tracking-widest hover:text-gold-300 transition-colors"
                    >
                      <Play size={14} fill="currentColor" />
                      {expanded === album.id ? 'Hide' : 'View'} Tracklist
                    </button>

                    {expanded === album.id && tracks[album.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-1 overflow-hidden"
                      >
                        {tracks[album.id].length === 0 ? (
                          <p className="text-cream/40 text-sm italic py-4">
                            Tracklist will be updated soon. Replace this by adding tracks in your admin panel.
                          </p>
                        ) : tracks[album.id].map((track) => (
                          <div key={track.id} className="flex items-center gap-4 py-2 px-3 hover:bg-dark-700 rounded transition-colors group/track">
                            <span className="w-6 text-center text-cream/30 text-sm group-hover/track:hidden">{track.track_number}</span>
                            <Play size={12} className="hidden group-hover/track:block text-gold-400 flex-shrink-0" fill="currentColor" />
                            <span className="flex-1 text-cream/80 text-sm group-hover/track:text-cream transition-colors">{track.title}</span>
                            <span className="text-cream/30 text-xs font-mono">{formatDuration(track.duration_seconds)}</span>
                            {track.spotify_url && (
                              <a href={track.spotify_url} target="_blank" rel="noreferrer"
                                className="text-cream/20 hover:text-green-400 transition-colors">
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

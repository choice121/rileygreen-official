import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown, Play } from 'lucide-react'

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1501386761578-eaa54b620fe8?w=1920&h=1080&fit=crop&auto=format&q=85',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1920&h=1080&fit=crop&auto=format&q=85',
  'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=1920&h=1080&fit=crop&auto=format&q=85',
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 6000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const scrollToContent = () => {
    const el = document.getElementById('music-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background images */}
      {HERO_IMAGES.map((img, i) => (
        <div
          key={img}
          className="absolute inset-0 transition-opacity duration-2000"
          style={{ opacity: i === current ? 1 : 0, transitionDuration: '1500ms' }}
        >
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover object-center scale-105"
            style={{ transform: i === current ? 'scale(1.05)' : 'scale(1)', transition: 'transform 8s ease-out' }}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding={i === 0 ? 'sync' : 'async'}
          />
        </div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900/50 via-dark-900/40 to-dark-800" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900/60 via-transparent to-dark-900/30" />

      {/* Gold vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-800 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* New album badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 border border-gold-400/40 rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-gold-400 text-xs font-display uppercase tracking-widest">
            New Album — That's Just Me — Out September 18
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-cream leading-none text-shadow"
        >
          Riley
          <br />
          <span className="shimmer-text">Green</span>
        </motion.h1>

        {/* Sub-tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-6 text-cream/60 text-lg md:text-xl font-sans max-w-lg mx-auto"
        >
          Authentic country music from Jacksonville, Alabama
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <a
            href="https://open.spotify.com/artist/2QMsj4XJ7ne2hojxt6v5eb"
            target="_blank"
            rel="noreferrer"
            className="btn-gold px-8 py-4 text-sm"
          >
            <Play size={16} fill="currentColor" />
            Listen Now
          </a>
          <Link to="/tour" className="btn-outline px-8 py-4 text-sm">
            Get Tickets
          </Link>
        </motion.div>

        {/* Slide indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-12 flex gap-2 justify-center"
        >
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                i === current ? 'w-8 bg-gold-400' : 'w-2 bg-cream/30'
              }`}
            />
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-cream/40 hover:text-gold-400 transition-colors animate-float"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} />
      </motion.button>
    </section>
  )
}

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

const navLinks = [
  { label: 'Music', href: '/music' },
  { label: 'Tour', href: '/tour' },
  { label: 'News', href: '/news' },
  { label: 'Videos', href: '/videos' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Merch', href: '/merch' },
  { label: 'Fan Club', href: '/join' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location])

  const isHome = location.pathname === '/'

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || !isHome
            ? 'bg-dark-900/95 backdrop-blur-md border-b border-gold-500/10 shadow-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group">
              <span className="font-display text-xl md:text-2xl font-bold tracking-widest uppercase">
                <span className="shimmer-text">Riley Green</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 text-xs font-display font-medium uppercase tracking-widest transition-colors duration-200 ${
                    location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href))
                      ? 'text-gold-400'
                      : 'text-cream/70 hover:text-cream'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Link
                to={user ? '/account' : '/login'}
                className="hidden md:flex items-center gap-2 text-cream/70 hover:text-gold-400 transition-colors"
              >
                <User size={18} />
                <span className="text-xs font-display uppercase tracking-widest">
                  {user ? 'Account' : 'Fan Club'}
                </span>
              </Link>
              <Link to="/merch" className="hidden md:block btn-gold py-2 px-4 text-xs">
                Shop
              </Link>
              <button
                onClick={() => setOpen(!open)}
                className="lg:hidden text-cream/80 hover:text-cream p-2"
                aria-label="Toggle menu"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-dark-900/95 backdrop-blur-xl" />
            <div className="relative h-full flex flex-col pt-24 px-8 pb-12">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      to={link.href}
                      className={`block py-4 text-2xl font-serif font-semibold border-b border-gold-500/10 transition-colors ${
                        location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href)) ? 'text-gold-400' : 'text-cream/80 hover:text-gold-400'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-8 flex flex-col gap-4">
                <Link to={user ? '/account' : '/login'} className="btn-outline w-full justify-center">
                  {user ? 'My Account' : 'Fan Club'}
                </Link>
                <Link to="/merch" className="btn-gold w-full justify-center">
                  Shop Now
                </Link>
              </div>
              {/* Socials */}
              <div className="mt-auto flex flex-wrap gap-5 text-cream/40">
                <a href="https://facebook.com/RileyGreenMusic" target="_blank" rel="noreferrer" className="hover:text-gold-400 text-sm uppercase tracking-widest font-display">Facebook</a>
                <a href="https://instagram.com/rileygreen" target="_blank" rel="noreferrer" className="hover:text-gold-400 text-sm uppercase tracking-widest font-display">Instagram</a>
                <a href="https://twitter.com/RileyGreenMusic" target="_blank" rel="noreferrer" className="hover:text-gold-400 text-sm uppercase tracking-widest font-display">X</a>
                <a href="https://tiktok.com/@rileyduckman" target="_blank" rel="noreferrer" className="hover:text-gold-400 text-sm uppercase tracking-widest font-display">TikTok</a>
                <a href="https://youtube.com/@rileygreen" target="_blank" rel="noreferrer" className="hover:text-gold-400 text-sm uppercase tracking-widest font-display">YouTube</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

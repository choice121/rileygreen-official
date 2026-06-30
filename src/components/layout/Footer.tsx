import { Link } from 'react-router-dom'
import { Instagram, Twitter, Youtube, Music } from 'lucide-react'

const footerLinks = {
  Music: [
    { label: 'Discography', href: '/music' },
    { label: 'Videos', href: '/videos' },
    { label: 'Gallery', href: '/gallery' },
  ],
  Explore: [
    { label: 'Tour Dates', href: '/tour' },
    { label: 'News', href: '/news' },
    { label: 'Merch', href: '/merch' },
  ],
  Connect: [
    { label: 'Fan Login', href: '/login' },
    { label: 'Contact / Press', href: '/contact' },
    { label: 'Newsletter', href: '/#newsletter' },
  ],
}

const socials = [
  { icon: Instagram, href: 'https://instagram.com/morganwallen', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com/MorganWallen', label: 'X / Twitter' },
  { icon: Youtube, href: 'https://youtube.com/@morganwallen', label: 'YouTube' },
  { icon: Music, href: 'https://open.spotify.com/artist/4oUHIQIBe0LkMauLosHQ6I', label: 'Spotify' },
]

export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-gold-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/">
              <span className="font-display text-2xl font-bold tracking-widest uppercase shimmer-text">
                Morgan Wallen
              </span>
            </Link>
            <p className="mt-4 text-cream/50 text-sm leading-relaxed max-w-xs">
              Country music artist from Sneedville, Tennessee. Authentic storytelling, real country music.
            </p>
            <div className="mt-6 flex gap-4">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-gold-500/20 flex items-center justify-center text-cream/50 hover:text-gold-400 hover:border-gold-400/50 transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-gold-400 font-display uppercase tracking-widest text-xs font-semibold mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-cream/50 hover:text-cream text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gold-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream/30 text-xs">
            © {new Date().getFullYear()} Morgan Wallen. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-cream/30 text-xs cursor-pointer hover:text-cream/60 transition-colors">Privacy Policy</span>
            <span className="text-cream/30 text-xs cursor-pointer hover:text-cream/60 transition-colors">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

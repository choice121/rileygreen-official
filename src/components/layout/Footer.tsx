import { Link } from 'react-router-dom'
import { Instagram, Twitter, Youtube, Music } from 'lucide-react'

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  )
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function AmazonMusicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.213 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.699-3.182v.685zm3.186 7.706a.661.661 0 01-.76.074c-1.068-.886-1.258-1.295-1.845-2.139-1.761 1.796-3.01 2.332-5.296 2.332-2.705 0-4.806-1.67-4.806-5.006 0-2.607 1.413-4.383 3.424-5.252 1.746-.773 4.183-.91 6.048-1.123v-.419c0-.773.06-1.685-.394-2.352-.397-.593-1.162-.838-1.833-.838-1.246 0-2.353.639-2.624 1.964-.056.295-.274.586-.577.601l-3.229-.349c-.271-.061-.572-.28-.494-.696C5.537 1.517 8.778 0 12.357 0c1.81 0 4.179.481 5.608 1.85 1.811 1.689 1.637 3.942 1.637 6.396v5.799c0 1.747.723 2.512 1.405 3.456.237.334.289.733-.012.979-.761.634-2.115 1.81-2.861 2.47l.01-.154zm3.07 3.8c-3.011 2.21-7.377 3.38-11.137 3.38-5.27 0-10.017-1.949-13.605-5.19-.282-.255-.031-.602.309-.404 3.877 2.256 8.666 3.614 13.613 3.614 3.34 0 7.016-.693 10.402-2.131.511-.218.937.337.418.731zm1.199-1.37c-.384-.494-2.543-.233-3.514-.117-.295.035-.34-.222-.074-.41 1.721-1.208 4.544-.859 4.874-.455.33.406-.086 3.24-1.705 4.59-.248.209-.486.097-.376-.177.364-.908 1.178-2.944.795-3.431z"/>
    </svg>
  )
}

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
    { label: 'Fan Club', href: '/join' },
    { label: 'Contact / Press', href: '/contact' },
    { label: 'Newsletter', href: '/#newsletter' },
  ],
}

type SocialIcon = React.ComponentType<{ size?: number }>

const socials: { icon: SocialIcon; href: string; label: string }[] = [
  { icon: FacebookIcon,     href: 'https://facebook.com/RileyGreenMusic',                              label: 'Facebook' },
  { icon: Instagram,        href: 'https://instagram.com/rileygreen',                             label: 'Instagram' },
  { icon: TikTokIcon,       href: 'https://tiktok.com/@rileyduckman',                               label: 'TikTok' },
  { icon: Twitter,          href: 'https://twitter.com/RileyGreenMusic',                               label: 'X / Twitter' },
  { icon: Youtube,          href: 'https://youtube.com/@rileygreen',                              label: 'YouTube' },
  { icon: AmazonMusicIcon,  href: 'https://music.amazon.com/artists/B00DFRX1P6/riley-green',     label: 'Amazon Music' },
  { icon: Music,            href: 'https://open.spotify.com/artist/2QMsj4XJ7ne2hojxt6v5eb',        label: 'Spotify' },
]

export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-gold-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <Link to="/">
              <span className="font-display text-2xl font-bold tracking-widest uppercase shimmer-text">
                Riley Green
              </span>
            </Link>
            <p className="mt-4 text-cream/50 text-sm leading-relaxed max-w-xs">
              Country music artist from Jacksonville, Alabama. Authentic storytelling, real country music.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
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

        <div className="mt-12 pt-8 border-t border-gold-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream/30 text-xs">
            © {new Date().getFullYear()} Riley Green. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/contact" className="text-cream/30 text-xs hover:text-cream/60 transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="text-cream/30 text-xs hover:text-cream/60 transition-colors">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

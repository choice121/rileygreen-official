import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, Crown, Star } from 'lucide-react'
import { Profile } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface FanCardProps {
  profile: Profile
  email: string
  /** If true, renders a non-interactive demo preview (no tilt, no buttons) */
  preview?: boolean
}

function padMember(n: number | null) {
  if (!n) return '000000'
  return String(n).padStart(6, '0')
}

function joinYear(created_at: string) {
  return new Date(created_at).getFullYear()
}

/** EMV-style gold chip rendered purely in CSS/SVG */
function Chip({ color = '#d4af37' }: { color?: string }) {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="43" height="33" rx="5.5" fill={color} fillOpacity="0.15" stroke={color} strokeOpacity="0.6" />
      {/* horizontal lines */}
      <line x1="0" y1="11" x2="44" y2="11" stroke={color} strokeOpacity="0.4" strokeWidth="0.8" />
      <line x1="0" y1="23" x2="44" y2="23" stroke={color} strokeOpacity="0.4" strokeWidth="0.8" />
      {/* vertical lines */}
      <line x1="15" y1="0" x2="15" y2="34" stroke={color} strokeOpacity="0.4" strokeWidth="0.8" />
      <line x1="29" y1="0" x2="29" y2="34" stroke={color} strokeOpacity="0.4" strokeWidth="0.8" />
      {/* center rectangle highlight */}
      <rect x="15" y="11" width="14" height="12" fill={color} fillOpacity="0.12" />
    </svg>
  )
}

/** Contactless payment symbol */
function Contactless({ color = '#d4af37' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 14c2.21 0 4-1.79 4-4S12.21 6 10 6" stroke={color} strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 17.5c3.86 0 7-3.14 7-7s-3.14-7-7-7" stroke={color} strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.5" fill={color} fillOpacity="0.7" />
    </svg>
  )
}

export default function FanCard({ profile, email, preview = false }: FanCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isVip = profile.tier === 'vip'
  const displayName = profile.full_name || email.split('@')[0]

  /* ── 3D tilt + holographic state ── */
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })
  const [foilPos, setFoilPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (preview) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const cx = (e.clientX - rect.left) / rect.width   // 0→1
    const cy = (e.clientY - rect.top) / rect.height   // 0→1
    setTilt({ x: (cy - 0.5) * -22, y: (cx - 0.5) * 22 })
    setGlare({ x: cx * 100, y: cy * 100, opacity: 0.35 })
    setFoilPos({ x: cx * 100, y: cy * 100 })
  }, [preview])

  const handleMouseLeave = useCallback(() => {
    if (preview) return
    setTilt({ x: 0, y: 0 })
    setGlare({ x: 50, y: 50, opacity: 0 })
    setFoilPos({ x: 50, y: 50 })
  }, [preview])

  /* ── download / share ── */
  async function handleDownload() {
    try {
      const { default: html2canvas } = await import('html2canvas')
      if (!cardRef.current) return
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `riley-green-fan-card-${padMember(profile.member_number)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Fan card downloaded!')
    } catch {
      toast.error('Download failed — try a screenshot instead')
    }
  }

  async function handleShare() {
    const text = isVip
      ? `I'm VIP member #${padMember(profile.member_number)} of the Riley Green Official Fan Club! 🤠👑 #RileyGreen #RileyGreenFanClub #VIP`
      : `I'm fan #${padMember(profile.member_number)} of the official Riley Green Fan Club! 🤠 #RileyGreen #RileyGreenFanClub`
    if (navigator.share) {
      await navigator.share({ text, url: 'https://rileygreen.com' })
    } else {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    }
  }

  const memberYear = isVip && profile.vip_since
    ? new Date(profile.vip_since).getFullYear()
    : joinYear(profile.created_at)

  /* ── colour tokens ── */
  const vip = {
    bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a1100 40%, #0d0a00 70%, #0d0d0d 100%)',
    stripe: 'linear-gradient(90deg, #c9a030 0%, #f0d060 30%, #c9a030 60%, #e8c040 100%)',
    foilA: '#d4af37',
    foilB: '#ffe066',
    chipColor: '#d4af37',
    text: '#f5e6b0',
    sub: 'rgba(245,230,176,0.55)',
    accent: '#d4af37',
    border: 'rgba(212,175,55,0.55)',
    shadow: '0 0 60px rgba(212,175,55,0.25), 0 20px 60px rgba(0,0,0,0.7)',
  }

  const fan = {
    bg: 'linear-gradient(135deg, #09101e 0%, #0d1929 40%, #091525 70%, #09101e 100%)',
    stripe: 'linear-gradient(90deg, #4a5568 0%, #718096 30%, #4a5568 60%, #6b7280 100%)',
    foilA: '#a0b0c8',
    foilB: '#d0dde8',
    chipColor: '#8fa0b4',
    text: '#e8eef5',
    sub: 'rgba(232,238,245,0.5)',
    accent: '#a0b4c8',
    border: 'rgba(160,180,200,0.4)',
    shadow: '0 0 40px rgba(100,140,180,0.15), 0 20px 60px rgba(0,0,0,0.7)',
  }

  const c = isVip ? vip : fan

  return (
    <div className="space-y-5">
      {/* Perspective wrapper */}
      <div
        className="relative select-none"
        style={{ perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* The physical card */}
        <div
          ref={cardRef}
          className="relative w-full max-w-[360px] mx-auto overflow-hidden"
          style={{
            aspectRatio: '1.586',
            borderRadius: '16px',
            background: c.bg,
            border: `1px solid ${c.border}`,
            boxShadow: preview ? 'none' : c.shadow,
            transform: preview
              ? 'none'
              : `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02,1.02,1.02)`,
            transition: tilt.x === 0 && tilt.y === 0
              ? 'transform 0.6s cubic-bezier(0.23,1,0.32,1), box-shadow 0.6s ease'
              : 'transform 0.05s ease-out',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* ── Foil / holographic layer ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: isVip
                ? `radial-gradient(ellipse 80% 80% at ${foilPos.x}% ${foilPos.y}%, rgba(255,220,80,0.18) 0%, rgba(255,150,0,0.10) 30%, rgba(200,100,255,0.06) 55%, transparent 75%),
                   repeating-linear-gradient(105deg, transparent, transparent 38px, rgba(212,175,55,0.07) 38px, rgba(212,175,55,0.07) 39px)`
                : `radial-gradient(ellipse 80% 80% at ${foilPos.x}% ${foilPos.y}%, rgba(160,200,255,0.15) 0%, rgba(100,180,255,0.08) 35%, rgba(180,120,255,0.05) 55%, transparent 75%),
                   repeating-linear-gradient(105deg, transparent, transparent 38px, rgba(160,190,220,0.06) 38px, rgba(160,190,220,0.06) 39px)`,
              transition: 'background-position 0.05s',
              borderRadius: '16px',
              zIndex: 2,
            }}
          />

          {/* ── Glare spot ── */}
          {!preview && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 55%)`,
                borderRadius: '16px',
                zIndex: 3,
                transition: 'opacity 0.1s',
              }}
            />
          )}

          {/* ── Ambient glow orbs ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: '16px' }}>
            {isVip ? (
              <>
                <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '55%', height: '55%', background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(180,120,0,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                <div style={{ position: 'absolute', top: '40%', left: '30%', width: '40%', height: '60%', background: 'radial-gradient(circle, rgba(255,200,50,0.07) 0%, transparent 70%)', filter: 'blur(25px)' }} />
              </>
            ) : (
              <>
                <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(100,160,220,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(80,120,180,0.1) 0%, transparent 70%)', filter: 'blur(20px)' }} />
              </>
            )}
          </div>

          {/* ── Card content ── */}
          <div
            className="relative h-full flex flex-col justify-between"
            style={{ padding: '20px 22px 0 22px', zIndex: 4 }}
          >
            {/* TOP ROW: brand + tier badge */}
            <div className="flex items-start justify-between">
              <div>
                <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: c.accent, fontWeight: 600 }}>
                  Riley Green
                </p>
                <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: c.sub, marginTop: '2px' }}>
                  Official Fan Club
                </p>
              </div>

              {/* Tier badge */}
              {isVip ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))',
                  border: '1px solid rgba(212,175,55,0.5)',
                  borderRadius: '100px', padding: '4px 10px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <Crown size={9} color="#d4af37" fill="#d4af37" />
                  <span style={{ fontFamily: 'var(--font-display, serif)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4af37', fontWeight: 700 }}>
                    Gold VIP
                  </span>
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: 'rgba(160,180,200,0.1)',
                  border: '1px solid rgba(160,180,200,0.25)',
                  borderRadius: '100px', padding: '4px 10px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <Star size={9} color="#a0b4c8" />
                  <span style={{ fontFamily: 'var(--font-display, serif)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0b4c8', fontWeight: 600 }}>
                    Fan Member
                  </span>
                </div>
              )}
            </div>

            {/* MIDDLE ROW: chip + contactless */}
            <div className="flex items-center gap-3">
              <Chip color={c.chipColor} />
              <Contactless color={c.chipColor} />
            </div>

            {/* BOTTOM SECTION: name + number */}
            <div>
              <div className="flex items-end justify-between" style={{ marginBottom: '14px' }}>
                <div>
                  {/* Name */}
                  <p style={{
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: c.text,
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                    textShadow: isVip ? '0 1px 8px rgba(212,175,55,0.3)' : 'none',
                    marginBottom: '10px',
                    maxWidth: '160px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {displayName.toUpperCase()}
                  </p>
                  {/* Labels row */}
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: c.sub, marginBottom: '2px' }}>
                        Member No.
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-display, serif)',
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        color: c.accent,
                        textShadow: isVip ? '0 0 12px rgba(212,175,55,0.5)' : 'none',
                      }}>
                        #{padMember(profile.member_number)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: c.sub, marginBottom: '2px' }}>
                        Member Since
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-display, serif)',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        color: c.text,
                      }}>
                        {memberYear}
                      </p>
                    </div>
                  </div>
                </div>

                {/* MW watermark monogram */}
                <div style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: '52px',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: isVip ? 'rgba(212,175,55,0.12)' : 'rgba(160,180,200,0.10)',
                  userSelect: 'none',
                  letterSpacing: '-2px',
                  marginBottom: '-2px',
                }}>
                  RG
                </div>
              </div>

              {/* Magnetic stripe */}
              <div style={{
                height: '28px',
                margin: '0 -22px',
                background: isVip
                  ? 'linear-gradient(90deg, #1a1100 0%, #2a1e00 20%, #1a1500 40%, #251a00 60%, #1a1100 100%)'
                  : 'linear-gradient(90deg, #0a0f18 0%, #101828 20%, #0c1420 40%, #101828 60%, #0a0f18 100%)',
                borderTop: isVip ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(100,140,180,0.15)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '22px',
                paddingRight: '22px',
                gap: '6px',
              }}>
                {/* Stripe texture lines */}
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: '12px',
                    borderRadius: '1px',
                    background: isVip
                      ? `rgba(212,175,55,${0.05 + (i % 3) * 0.03})`
                      : `rgba(120,160,200,${0.04 + (i % 3) * 0.02})`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      {!preview && (
        <div className="flex gap-3 justify-center pt-1">
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm transition-all text-xs font-display uppercase tracking-widest"
            style={{
              background: isVip ? 'rgba(212,175,55,0.08)' : 'rgba(100,140,180,0.08)',
              border: `1px solid ${isVip ? 'rgba(212,175,55,0.3)' : 'rgba(100,140,180,0.25)'}`,
              color: isVip ? '#d4af37' : '#a0b4c8',
            }}
          >
            <Download size={13} />
            Download
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm transition-all text-xs font-display uppercase tracking-widest"
            style={{
              background: isVip ? 'rgba(212,175,55,0.08)' : 'rgba(100,140,180,0.08)',
              border: `1px solid ${isVip ? 'rgba(212,175,55,0.3)' : 'rgba(100,140,180,0.25)'}`,
              color: isVip ? '#d4af37' : '#a0b4c8',
            }}
          >
            <Share2 size={13} />
            Share
          </motion.button>
        </div>
      )}
    </div>
  )
}

/** Demo card for use in marketing pages (uses fake profile data) */
export function DemoFanCard({ tier = 'fan' }: { tier?: 'fan' | 'vip' }) {
  const demoProfile: Profile = {
    id: 'demo',
    username: null,
    full_name: tier === 'vip' ? 'Your Name Here' : 'Your Name Here',
    avatar_url: null,
    bio: null,
    is_admin: false,
    tier,
    member_number: tier === 'vip' ? 47 : 1024,
    vip_since: tier === 'vip' ? '2024-01-01T00:00:00Z' : null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
  return <FanCard profile={demoProfile} email="fan@example.com" preview={true} />
}

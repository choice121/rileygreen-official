import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Crown, Star, Check, Ticket, Image, Video, Newspaper, Hash, CreditCard, Sparkles, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { DemoFanCard } from '../components/ui/FanCard'

const FREE_PERKS = [
  { icon: Star,      text: 'Official digital Fan Card with unique member number' },
  { icon: Newspaper, text: 'Access to all public news & content' },
  { icon: Ticket,    text: 'General ticket announcements' },
  { icon: CreditCard,text: 'Downloadable & shareable card image' },
]

const VIP_PERKS = [
  { icon: Crown,     text: 'Exclusive Gold VIP Fan Card with chip' },
  { icon: Hash,      text: 'Lower member number — earlier = rarer' },
  { icon: Ticket,    text: '48-hour early tour ticket access' },
  { icon: Newspaper, text: 'VIP-only news & exclusive articles' },
  { icon: Image,     text: 'Members-only behind-the-scenes gallery' },
  { icon: Video,     text: 'Exclusive studio sessions & videos' },
  { icon: Zap,       text: 'Priority access to new releases & drops' },
]

export default function JoinPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const isVip = profile?.tier === 'vip'
  const isFan = !!user && !isVip

  return (
    <div className="min-h-screen bg-dark-900 pt-20">

      {/* ── Hero ── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gold-500/8 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 px-4 py-1.5 rounded-full mb-6">
              <Crown size={13} className="text-gold-400" fill="currentColor" />
              <span className="text-gold-400 font-display text-xs uppercase tracking-widest">Club Wallen</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-cream leading-tight">
              Join the <span className="shimmer-text">Inner Circle</span>
            </h1>
            <p className="mt-5 text-cream/60 text-lg max-w-xl mx-auto leading-relaxed">
              Become an official member. Get your digital membership card, exclusive content, and early access to everything Riley Green.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Tier Cards ── */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Fan Tier ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className="flex flex-col"
          >
            {/* Card preview */}
            <div className="mb-6 px-4">
              <p className="text-center text-cream/30 text-[10px] font-display uppercase tracking-widest mb-3">Fan Member Card Preview</p>
              <DemoFanCard tier="fan" />
            </div>

            {/* Tier info panel */}
            <div className="bg-dark-800 border border-cream/10 rounded-sm p-7 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-cream/5 border border-cream/15 flex items-center justify-center flex-shrink-0">
                  <Star size={15} className="text-cream/50" />
                </div>
                <div>
                  <p className="font-display text-[10px] uppercase tracking-widest text-cream/40">Fan Member</p>
                  <p className="font-serif text-xl text-cream font-semibold">Free</p>
                </div>
              </div>

              <p className="text-cream/40 text-sm mt-1 mb-5 leading-relaxed">
                Create an account and get your official fan card with a unique member number — yours to keep forever.
              </p>

              <ul className="space-y-2.5 mb-7 flex-1">
                {FREE_PERKS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <Check size={13} className="text-cream/35 mt-0.5 flex-shrink-0" />
                    <span className="text-cream/55 text-sm leading-snug">{text}</span>
                  </li>
                ))}
              </ul>

              {user ? (
                <Link to="/account" className="btn-outline w-full justify-center text-sm py-3">
                  View My Card
                </Link>
              ) : (
                <Link to="/login?mode=signup" className="btn-outline w-full justify-center text-sm py-3">
                  Sign Up Free
                </Link>
              )}
            </div>
          </motion.div>

          {/* ── VIP Tier ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.55 }}
            className="flex flex-col"
          >
            {/* Card preview */}
            <div className="mb-6 px-4">
              <p className="text-center text-gold-500/50 text-[10px] font-display uppercase tracking-widest mb-3">Gold VIP Card Preview</p>
              <DemoFanCard tier="vip" />
            </div>

            {/* Tier info panel */}
            <div className="relative bg-gradient-to-br from-dark-800 via-[#1a1200] to-dark-900 border border-gold-500/40 rounded-sm p-7 flex flex-col flex-1 overflow-hidden shadow-xl shadow-gold-500/10">
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-56 h-56 bg-gold-500/8 blur-3xl rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />

              {/* Best badge */}
              <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-gold-500 text-dark-900 text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                <Sparkles size={9} />
                Best
              </div>

              <div className="flex items-center gap-3 mb-3 relative">
                <div className="w-9 h-9 rounded-full bg-gold-500/20 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
                  <Crown size={15} className="text-gold-400" fill="currentColor" />
                </div>
                <div>
                  <p className="font-display text-[10px] uppercase tracking-widest text-gold-400/70">VIP Member</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-serif text-xl text-gold-100 font-semibold">$9.99</p>
                    <span className="text-cream/40 text-xs">/ month</span>
                  </div>
                </div>
              </div>

              <p className="text-cream/50 text-sm mt-1 mb-5 leading-relaxed relative">
                The full Club Wallen experience — your gold card, exclusive content, and early access to everything.
              </p>

              <ul className="space-y-2.5 mb-7 flex-1 relative">
                {VIP_PERKS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <Check size={13} className="text-gold-400 mt-0.5 flex-shrink-0" />
                    <span className="text-cream/70 text-sm leading-snug">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="relative">
                {isVip ? (
                  <div className="w-full text-center py-3 bg-gold-500/10 border border-gold-500/30 rounded-sm text-gold-400 font-display text-xs uppercase tracking-widest">
                    You're Already VIP ✓
                  </div>
                ) : isFan ? (
                  <VipRequestButton />
                ) : (
                  <Link to="/login?next=/join&mode=signup" className="btn-gold w-full justify-center text-sm py-3">
                    <Crown size={14} fill="currentColor" />
                    Join VIP Now
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center text-cream/25 text-[10px] mt-10 font-display uppercase tracking-widest"
        >
          Secure billing · Cancel anytime · Instant access
        </motion.p>
      </section>

      {/* ── FAQ ── */}
      <section className="pb-28 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl text-cream">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'What is my member number?',
                a: 'Your member number is unique to you and assigned the moment you sign up. The earlier you join, the lower your number — it\'s a badge of honor for OG fans.'
              },
              {
                q: 'What does my fan card look like?',
                a: 'It\'s a premium digital membership card (shown in the preview above) — complete with a chip, your name, and member number. Fan members get a midnight navy card; VIP members get the exclusive gold card.'
              },
              {
                q: 'Can I download my fan card?',
                a: 'Yes — your digital fan card can be downloaded as a high-resolution PNG straight from your account page. Share it on social, print it out, or keep it as a collectible.'
              },
              {
                q: 'How do I access VIP-only content?',
                a: 'Once your account is upgraded to VIP, all exclusive content unlocks automatically on the news, gallery, and videos pages. No extra steps needed.'
              },
              {
                q: 'When does early tour access kick in?',
                a: 'VIP members see new tour dates 48 hours before they go public. Make sure you\'re signed in to see them on the Tour page.'
              },
            ].map(({ q, a }, i) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="bg-dark-800 border border-gold-500/10 hover:border-gold-500/20 rounded-sm p-5 transition-colors"
              >
                <p className="font-serif text-cream font-medium mb-2">{q}</p>
                <p className="text-cream/50 text-sm leading-relaxed">{a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function VipRequestButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/contact?subject=VIP+Membership+Request')}
      className="btn-gold w-full justify-center text-sm py-3"
    >
      <Crown size={14} fill="currentColor" />
      Request VIP Access
    </button>
  )
}

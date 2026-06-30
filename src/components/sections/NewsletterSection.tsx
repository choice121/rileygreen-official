import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import Button from '../ui/Button'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.trim().toLowerCase(), first_name: firstName.trim() || null })

    setLoading(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('This email is already subscribed!')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } else {
      setDone(true)
      toast.success('You\'re in! Check your inbox for a confirmation email.')
    }
  }

  return (
    <section id="newsletter" className="section-padding bg-dark-900 relative overflow-hidden">
      {/* Gold glow bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-xl relative z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-6">
            <Mail size={24} className="text-gold-400" />
          </div>
          <p className="section-subtitle mb-4">Stay Connected</p>
          <h2 className="section-title text-4xl md:text-5xl">Join the Fan Club</h2>
          <p className="mt-4 text-cream/50 text-lg">
            Get exclusive updates, presale access, behind-the-scenes content, and more — straight to your inbox.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          {done ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-gold-400 mx-auto mb-4" />
              <h3 className="font-serif text-2xl text-cream mb-2">You're subscribed!</h3>
              <p className="text-cream/50">Check your inbox for a confirmation email.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="flex-1 bg-dark-700 gold-border rounded-sm px-4 py-3 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/60 transition-colors text-sm"
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-dark-700 gold-border rounded-sm px-4 py-3 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/60 transition-colors text-sm"
                />
              </div>
              <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                <Send size={16} />
                Subscribe for Free
              </Button>
              <p className="text-center text-cream/30 text-xs">
                No spam, ever. Unsubscribe at any time.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}

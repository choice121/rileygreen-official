import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Mail, MessageSquare, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'

const INQUIRY_TYPES = ['general', 'press', 'booking', 'business', 'fan-mail']

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', inquiry_type: 'general' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function update(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('contact_submissions').insert({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      subject: form.subject.trim() || null,
      message: form.message.trim(),
      inquiry_type: form.inquiry_type,
    })

    setLoading(false)
    if (error) {
      toast.error('Something went wrong. Please try again.')
    } else {
      setDone(true)
      toast.success('Message sent!')
    }
  }

  const inputClass = "w-full bg-dark-700 gold-border rounded-sm px-4 py-3 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/60 transition-colors text-sm"

  return (
    <div className="min-h-screen bg-dark-800 pt-24">
      <div className="py-20 px-4 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <p className="section-subtitle mb-4">Get in Touch</p>
          <h1 className="section-title">Contact</h1>
        </div>
      </div>

      <div className="section-padding">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            {[
              { icon: Mail, title: 'Press Inquiries', text: 'For media and press requests, select "Press" as your inquiry type.' },
              { icon: MessageSquare, title: 'Fan Mail', text: 'Send love and messages — we read everything.' },
              { icon: Send, title: 'Business', text: 'For booking and business opportunities, select the appropriate type.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon size={20} className="text-gold-400" />
                </div>
                <h3 className="font-serif text-lg text-cream mb-2">{title}</h3>
                <p className="text-cream/50 text-sm">{text}</p>
              </div>
            ))}
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 gold-border rounded-sm bg-dark-700"
            >
              <CheckCircle size={56} className="text-gold-400 mx-auto mb-5" />
              <h2 className="font-serif text-3xl text-cream mb-3">Message received!</h2>
              <p className="text-cream/50">We'll get back to you at {form.email} soon.</p>
              <button onClick={() => { setDone(false); setForm({ name: '', email: '', subject: '', message: '', inquiry_type: 'general' }) }}
                className="mt-8 btn-outline text-sm">
                Send Another
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5 p-8 bg-dark-700 gold-border rounded-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Your Name *</label>
                  <input type="text" required placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Email Address *</label>
                  <input type="email" required placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Inquiry Type</label>
                <select value={form.inquiry_type} onChange={e => update('inquiry_type', e.target.value)} className={inputClass}>
                  {INQUIRY_TYPES.map(t => (
                    <option key={t} value={t} className="bg-dark-800">{t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Subject</label>
                <input type="text" placeholder="What's it about?" value={form.subject} onChange={e => update('subject', e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Message *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write your message here..."
                  value={form.message}
                  onChange={e => update('message', e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <Button type="submit" loading={loading} fullWidth size="lg">
                <Send size={16} /> Send Message
              </Button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  )
}

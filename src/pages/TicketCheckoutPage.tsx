import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Ticket, Shield, CheckCircle, MapPin, Calendar, Clock, ChevronRight, Minus, Plus, Crown, Star, Users, Music } from 'lucide-react'
import { supabase, TourDate, TicketOrder } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { format } from 'date-fns'

const TICKET_TYPES = [
  {
    id: 'general',
    label: 'General Admission',
    price: 89,
    icon: Ticket,
    color: 'border-cream/20 hover:border-cream/40',
    selectedColor: 'border-gold-500 bg-gold-500/5',
    badge: null,
    perks: ['Standing floor access', 'Official event lanyard', 'Digital ticket delivery'],
  },
  {
    id: 'floor',
    label: 'Floor Standing',
    price: 149,
    icon: Star,
    color: 'border-gold-500/30 hover:border-gold-500/60',
    selectedColor: 'border-gold-400 bg-gold-500/10',
    badge: 'Popular',
    perks: ['Priority floor sections', 'Closer to stage', 'Fast-track entry', 'Digital ticket delivery'],
  },
  {
    id: 'vip_experience',
    label: 'VIP Experience',
    price: 299,
    icon: Crown,
    color: 'border-gold-500/40 hover:border-gold-400',
    selectedColor: 'border-gold-400 bg-gold-500/15',
    badge: 'Best Value',
    perks: ['Front-row floor access', 'Exclusive merch bundle', 'Soundcheck access', 'Early venue entry', 'Premium bar access', 'Dedicated VIP host'],
  },
]

function generateOrderNumber() {
  return 'MW-' + Math.floor(100000 + Math.random() * 900000)
}

export default function TicketCheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const isVip = profile?.tier === 'vip'

  const [show, setShow] = useState<TourDate | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('floor')
  const [quantity, setQuantity] = useState(2)
  const [step, setStep] = useState<'select' | 'details' | 'processing'>('select')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: profile?.full_name ?? '',
    email: user?.email ?? '',
    phone: '',
  })

  useEffect(() => {
    if (!id) return
    supabase.from('tour_dates').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setShow(data as TourDate)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (profile?.full_name) setForm(f => ({ ...f, name: profile.full_name ?? '' }))
    if (user?.email) setForm(f => ({ ...f, email: user.email ?? '' }))
  }, [profile, user])

  const selected = TICKET_TYPES.find(t => t.id === selectedType)!
  const discount = isVip ? 0.10 : 0
  const unitPrice = Math.round(selected.price * (1 - discount))
  const total = unitPrice * quantity
  const savings = isVip ? selected.price * quantity - total : 0

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!show || !form.name || !form.email) return
    setSubmitting(true)
    setStep('processing')

    await new Promise(r => setTimeout(r, 2000))

    const orderNumber = generateOrderNumber()
    const { data, error } = await supabase.from('ticket_orders').insert({
      order_number: orderNumber,
      tour_date_id: show.id,
      customer_name: form.name.trim(),
      customer_email: form.email.trim().toLowerCase(),
      customer_phone: form.phone.trim() || null,
      ticket_type: selectedType,
      quantity,
      unit_price: unitPrice,
      total_price: total,
      status: 'reserved',
      user_id: user?.id ?? null,
    }).select().single()

    if (error || !data) {
      setStep('details')
      setSubmitting(false)
      alert('Something went wrong. Please try again.')
      return
    }

    navigate(`/order-confirmation/${(data as TicketOrder).id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 pt-24 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-dark-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cream/50 text-lg">Show not found.</p>
          <Link to="/tour" className="mt-4 inline-block text-gold-400 text-sm hover:underline">← Back to Tour</Link>
        </div>
      </div>
    )
  }

  const showDate = new Date(show.event_date + 'T00:00:00')

  return (
    <div className="min-h-screen bg-dark-900 pt-20">
      {/* Processing overlay */}
      {step === 'processing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-dark-900/95 backdrop-blur flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin mx-auto mb-6" />
            <p className="font-serif text-cream text-xl mb-2">Securing Your Tickets</p>
            <p className="text-cream/50 text-sm">Please wait while we process your order…</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-dark-800 border-b border-gold-500/10 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-cream/40 text-xs font-display uppercase tracking-widest mb-4">
            <Link to="/tour" className="hover:text-cream/70 transition-colors">Tour</Link>
            <ChevronRight size={12} />
            <span className="text-cream/70">Tickets</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold text-cream">
                Riley Green — {show.city}{show.state ? `, ${show.state}` : ''}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-cream/50 text-sm">
                <span className="flex items-center gap-1.5"><Calendar size={13} className="text-gold-400" />{format(showDate, 'EEEE, MMMM d, yyyy')}</span>
                {show.event_time && <span className="flex items-center gap-1.5"><Clock size={13} className="text-gold-400" />{show.event_time}</span>}
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-gold-400" />{show.venue}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Tickets Available
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {step === 'select' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-3 gap-8">
            {/* Ticket selection */}
            <div className="lg:col-span-2 space-y-6">
              {isVip && (
                <div className="flex items-center gap-3 bg-gold-500/8 border border-gold-500/25 rounded-sm px-4 py-3">
                  <Crown size={16} className="text-gold-400 flex-shrink-0" fill="currentColor" />
                  <p className="text-gold-400 text-sm font-display">VIP Member — 10% discount applied to all ticket types</p>
                </div>
              )}

              <div>
                <h2 className="font-serif text-lg text-cream mb-4">Select Ticket Type</h2>
                <div className="space-y-3">
                  {TICKET_TYPES.map((type) => {
                    const Icon = type.icon
                    const discountedPrice = Math.round(type.price * (1 - discount))
                    const isSelected = selectedType === type.id
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`w-full text-left rounded-sm border p-5 transition-all duration-200 ${isSelected ? type.selectedColor : type.color + ' bg-dark-800'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-gold-500/20 border border-gold-500/40' : 'bg-dark-700 border border-gold-500/10'}`}>
                              <Icon size={17} className={isSelected ? 'text-gold-400' : 'text-cream/40'} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-display text-sm uppercase tracking-widest font-semibold ${isSelected ? 'text-cream' : 'text-cream/70'}`}>{type.label}</span>
                                {type.badge && (
                                  <span className="bg-gold-500 text-dark-900 text-[9px] font-display uppercase tracking-widest px-2 py-0.5 rounded-full font-bold">{type.badge}</span>
                                )}
                              </div>
                              <ul className="mt-2 space-y-1">
                                {type.perks.map(p => (
                                  <li key={p} className="flex items-center gap-1.5 text-xs text-cream/50">
                                    <CheckCircle size={11} className="text-gold-400 flex-shrink-0" />
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {isVip && type.price !== discountedPrice && (
                              <p className="text-cream/30 text-xs line-through">${type.price}</p>
                            )}
                            <p className={`font-serif text-xl font-bold ${isSelected ? 'text-gold-400' : 'text-cream/60'}`}>${discountedPrice}</p>
                            <p className="text-cream/30 text-xs">per ticket</p>
                          </div>
                        </div>
                        <div className={`mt-4 flex items-center gap-2 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-4 h-4 rounded-full border-2 border-gold-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gold-400" />
                          </div>
                          <span className="text-gold-400 text-xs font-display uppercase tracking-wider">Selected</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h2 className="font-serif text-lg text-cream mb-4">Quantity</h2>
                <div className="flex items-center gap-4 bg-dark-800 border border-gold-500/15 rounded-sm p-4 w-fit">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full border border-gold-500/30 flex items-center justify-center text-cream/60 hover:text-cream hover:border-gold-500/60 transition-colors disabled:opacity-30"
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-serif text-2xl font-bold text-cream w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(6, q + 1))}
                    className="w-9 h-9 rounded-full border border-gold-500/30 flex items-center justify-center text-cream/60 hover:text-cream hover:border-gold-500/60 transition-colors disabled:opacity-30"
                    disabled={quantity >= 6}
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-cream/30 text-xs ml-2">Max 6 per order</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Shield, label: 'Secure Order', sub: '256-bit encrypted' },
                  { icon: CheckCircle, label: 'Official', sub: 'Verified seller' },
                  { icon: Users, label: 'Guaranteed', sub: '100% authentic' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="text-center border border-gold-500/10 rounded-sm p-3 bg-dark-800">
                    <Icon size={18} className="mx-auto mb-1 text-gold-400/60" />
                    <p className="text-cream/60 text-xs font-display uppercase tracking-widest">{label}</p>
                    <p className="text-cream/30 text-[10px] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-dark-800 border border-gold-500/20 rounded-sm overflow-hidden">
                <div className="bg-dark-700 px-5 py-4 border-b border-gold-500/10">
                  <p className="font-display text-xs uppercase tracking-widest text-gold-400">Order Summary</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-cream text-sm font-semibold">{selected.label}</p>
                    <p className="text-cream/40 text-xs mt-1">{format(showDate, 'MMM d, yyyy')} · {show.venue}</p>
                  </div>
                  <div className="border-t border-gold-500/10 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cream/50">${unitPrice} × {quantity}</span>
                      <span className="text-cream">${unitPrice * quantity}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gold-400/70">VIP discount (10%)</span>
                        <span className="text-gold-400">−${savings}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-cream/50">Service fee</span>
                      <span className="text-cream/50">Included</span>
                    </div>
                  </div>
                  <div className="border-t border-gold-500/20 pt-4 flex justify-between items-center">
                    <span className="font-display text-xs uppercase tracking-widest text-cream/50">Total</span>
                    <span className="font-serif text-2xl font-bold text-cream">${total}</span>
                  </div>
                  <button
                    onClick={() => setStep('details')}
                    className="w-full btn-gold py-3.5 text-sm flex items-center justify-center gap-2"
                  >
                    <Ticket size={16} /> Continue to Details
                  </button>
                  <div className="flex items-center gap-1.5 justify-center text-cream/30 text-[10px]">
                    <Shield size={10} />
                    Secure checkout — your data is protected
                  </div>
                </div>
              </div>

              {/* Limited availability */}
              <div className="mt-3 border border-amber-500/20 bg-amber-500/5 rounded-sm px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <p className="text-amber-400/80 text-xs">Limited tickets remaining for this show</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('select')} className="text-cream/40 hover:text-cream text-sm transition-colors">← Back</button>
                <span className="text-cream/20">|</span>
                <p className="text-cream/60 text-sm">Step 2 of 2 — Your Details</p>
              </div>

              <form onSubmit={handleOrder} className="space-y-5">
                <div className="bg-dark-800 border border-gold-500/15 rounded-sm p-6 space-y-5">
                  <h2 className="font-serif text-lg text-cream">Contact Information</h2>
                  <p className="text-cream/40 text-sm -mt-1">Payment instructions will be sent to the email below after your order is placed.</p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="John Smith"
                        className="w-full bg-dark-700 border border-gold-500/15 rounded-sm px-4 py-3 text-cream text-sm placeholder-cream/25 focus:outline-none focus:border-gold-400/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-dark-700 border border-gold-500/15 rounded-sm px-4 py-3 text-cream text-sm placeholder-cream/25 focus:outline-none focus:border-gold-400/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full bg-dark-700 border border-gold-500/15 rounded-sm px-4 py-3 text-cream text-sm placeholder-cream/25 focus:outline-none focus:border-gold-400/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="bg-dark-800 border border-gold-500/10 rounded-sm px-5 py-4 flex items-start gap-3">
                  <CheckCircle size={16} className="text-gold-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-cream/70 text-sm">By completing this order you agree to our ticket terms. All sales are final. Resale is prohibited.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-gold py-4 text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Shield size={15} />
                      Complete Order — ${total}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-6 text-cream/20 text-xs">
                  {['Secure', 'Official', 'Encrypted'].map(t => (
                    <span key={t} className="flex items-center gap-1">
                      <CheckCircle size={10} className="text-gold-400/40" /> {t}
                    </span>
                  ))}
                </div>
              </form>
            </div>

            {/* Summary sidebar */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-dark-800 border border-gold-500/20 rounded-sm overflow-hidden">
                <div className="bg-dark-700 px-5 py-4 border-b border-gold-500/10">
                  <p className="font-display text-xs uppercase tracking-widest text-gold-400">Your Order</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cream/60">{selected.label}</span>
                      <span className="text-cream">{quantity}×</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cream/40 text-xs">{show.city} · {format(showDate, 'MMM d')}</span>
                      <span className="text-cream/70">${unitPrice}/ea</span>
                    </div>
                  </div>
                  <div className="border-t border-gold-500/15 pt-4 flex justify-between">
                    <span className="font-display text-xs uppercase tracking-widest text-cream/50">Total</span>
                    <span className="font-serif text-2xl font-bold text-cream">${total}</span>
                  </div>
                  <div className="bg-dark-700/50 rounded-sm px-3 py-3 space-y-1">
                    <p className="text-cream/50 text-xs font-display uppercase tracking-widest">What happens next</p>
                    <p className="text-cream/60 text-xs leading-relaxed mt-1">Your tickets will be reserved instantly. Our team will send payment instructions to your email within 2 hours.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

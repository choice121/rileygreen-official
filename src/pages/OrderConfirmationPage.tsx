import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Ticket, MapPin, Calendar, Mail, Clock, ChevronRight, Music } from 'lucide-react'
import { supabase, TourDate, TicketOrder } from '../lib/supabase'
import { format } from 'date-fns'

type OrderWithShow = TicketOrder & { show?: TourDate }

const TYPE_LABELS: Record<string, string> = {
  general: 'General Admission',
  floor: 'Floor Standing',
  vip_experience: 'VIP Experience',
}

const STATUS_STEPS = [
  { key: 'reserved',   label: 'Order Reserved',       sub: 'Your tickets are held' },
  { key: 'contacted',  label: 'Team Contacted You',    sub: 'Payment instructions sent' },
  { key: 'processing', label: 'Payment Processing',    sub: 'Verifying your payment' },
  { key: 'confirmed',  label: 'Tickets Confirmed',     sub: 'See you at the show!' },
]

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderWithShow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('ticket_orders').select('*').eq('id', id).single().then(async ({ data }) => {
      if (!data) { setLoading(false); return }
      const o = data as TicketOrder
      const { data: show } = await supabase.from('tour_dates').select('*').eq('id', o.tour_date_id).single()
      setOrder({ ...o, show: show as TourDate | undefined })
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 pt-24 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cream/50 text-lg">Order not found.</p>
          <Link to="/tour" className="mt-4 inline-block text-gold-400 text-sm hover:underline">← Back to Tour</Link>
        </div>
      </div>
    )
  }

  const showDate = order.show ? new Date(order.show.event_date + 'T00:00:00') : null
  const currentStep = STATUS_STEPS.findIndex(s => s.key === order.status)

  return (
    <div className="min-h-screen bg-dark-900 pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="text-center mb-10"
        >
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
              <CheckCircle size={44} className="text-emerald-400" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center"
            >
              <Ticket size={14} className="text-dark-900" />
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="font-serif text-3xl font-bold text-cream mt-6 mb-2">Order Confirmed!</h1>
            <p className="text-cream/50">Your tickets are reserved and secured.</p>
          </motion.div>
        </motion.div>

        {/* Order number card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-800 border border-gold-500/25 rounded-sm overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-gold-500/10 to-transparent border-b border-gold-500/15 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-cream/40 text-xs font-display uppercase tracking-widest">Order Number</p>
              <p className="font-serif text-2xl font-bold text-gold-400 mt-0.5">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-cream/40 text-xs font-display uppercase tracking-widest">Total Paid</p>
              <p className="font-serif text-2xl font-bold text-cream mt-0.5">${order.total_price}</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Show details */}
            {order.show && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-cream">
                  <Music size={14} className="text-gold-400" />
                  <span className="font-serif font-semibold">Morgan Wallen</span>
                </div>
                {showDate && (
                  <div className="flex items-center gap-2 text-cream/60 text-sm">
                    <Calendar size={13} className="text-gold-400/60" />
                    <span>{format(showDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-cream/60 text-sm">
                  <MapPin size={13} className="text-gold-400/60" />
                  <span>{order.show.venue} · {order.show.city}{order.show.state ? `, ${order.show.state}` : ''}</span>
                </div>
              </div>
            )}

            <div className="border-t border-gold-500/10 pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-cream/40 text-xs uppercase tracking-widest font-display">Ticket Type</p>
                <p className="text-cream mt-1">{TYPE_LABELS[order.ticket_type] ?? order.ticket_type}</p>
              </div>
              <div>
                <p className="text-cream/40 text-xs uppercase tracking-widest font-display">Quantity</p>
                <p className="text-cream mt-1">{order.quantity} ticket{order.quantity !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-cream/40 text-xs uppercase tracking-widest font-display">Name</p>
                <p className="text-cream mt-1">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-cream/40 text-xs uppercase tracking-widest font-display">Email</p>
                <p className="text-cream mt-1 truncate">{order.customer_email}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-dark-800 border border-gold-500/15 rounded-sm p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Mail size={16} className="text-gold-400" />
            <h2 className="font-serif text-lg text-cream">What Happens Next</h2>
          </div>

          <div className="bg-gold-500/8 border border-gold-500/20 rounded-sm px-4 py-3 mb-5">
            <p className="text-gold-300 text-sm leading-relaxed">
              Our secure payment team will send payment instructions to <strong className="text-gold-400">{order.customer_email}</strong> within <strong className="text-gold-400">2 hours</strong>. Please also check your spam folder.
            </p>
          </div>

          {/* Progress steps */}
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const isComplete = i < currentStep
              const isCurrent = i === currentStep
              const isLast = i === STATUS_STEPS.length - 1
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${
                      isComplete ? 'border-emerald-500 bg-emerald-500/20' :
                      isCurrent ? 'border-gold-400 bg-gold-500/20' :
                      'border-cream/10 bg-dark-700'
                    }`}>
                      {isComplete ? (
                        <CheckCircle size={14} className="text-emerald-400" />
                      ) : isCurrent ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-cream/15" />
                      )}
                    </div>
                    {!isLast && <div className={`w-0.5 h-8 mt-1 mb-1 ${isComplete ? 'bg-emerald-500/40' : 'bg-cream/10'}`} />}
                  </div>
                  <div className="pb-6 flex-1">
                    <p className={`text-sm font-semibold ${isComplete ? 'text-emerald-400' : isCurrent ? 'text-cream' : 'text-cream/30'}`}>
                      {step.label}
                      {isCurrent && <span className="ml-2 text-gold-400/70 text-xs font-normal font-display uppercase tracking-widest">Current</span>}
                    </p>
                    <p className={`text-xs mt-0.5 ${isComplete || isCurrent ? 'text-cream/50' : 'text-cream/20'}`}>{step.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link to="/account" className="flex-1 btn-gold py-3.5 text-sm text-center flex items-center justify-center gap-2">
            <Ticket size={15} /> View My Orders
          </Link>
          <Link to="/tour" className="flex-1 py-3.5 text-sm text-center border border-gold-500/20 text-cream/60 hover:text-cream hover:border-gold-500/40 transition-colors rounded-sm flex items-center justify-center gap-2">
            <Calendar size={15} /> Browse More Shows
          </Link>
        </motion.div>

        <p className="text-center text-cream/25 text-xs mt-6">
          Questions? Contact us at <span className="text-gold-400/60">support@morganwallen.com</span>
        </p>
      </div>
    </div>
  )
}

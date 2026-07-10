import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Ticket, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, TourDate } from '../lib/supabase'
import { format } from 'date-fns'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function TourPage() {
  const [dates, setDates] = useState<TourDate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')

  useEffect(() => {
    const query = supabase.from('tour_dates').select('*').order('event_date', { ascending: true })
    if (filter === 'upcoming') {
      query.gte('event_date', new Date().toISOString().split('T')[0])
    }
    query.then(({ data }) => {
      if (data) setDates(data as TourDate[])
      setLoading(false)
    })
  }, [filter])

  return (
    <div className="min-h-screen bg-dark-800 pt-24">
      <div className="relative py-20 px-4 bg-dark-900 overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none select-none">
          <div className="text-[15rem] font-display font-black text-gold-500 leading-none">LIVE</div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <p className="section-subtitle mb-4">Cowboy As It Gets Tour 2026</p>
          <h1 className="section-title">Tour Dates</h1>
          <p className="mt-4 text-cream/50 max-w-xl">
            Experience Riley Green live. Select a city near you and get your tickets before they sell out.
          </p>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-xl">
          {/* Filter tabs */}
          <div className="flex gap-4 mb-10">
            {(['upcoming', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 text-xs font-display uppercase tracking-widest rounded-sm transition-all ${
                  filter === f ? 'bg-gold-500 text-dark-900' : 'border border-gold-500/30 text-cream/50 hover:border-gold-500/60'
                }`}
              >
                {f === 'upcoming' ? 'Upcoming' : 'All Shows'}
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="space-y-3">
              {dates.length === 0 && (
                <div className="text-center py-20 text-cream/40">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-serif text-xl">No upcoming dates found.</p>
                  <p className="text-sm mt-2">Check back soon — new shows are always being announced.</p>
                </div>
              )}
              {dates.map((date, i) => (
                <motion.div
                  key={date.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-sm border transition-all duration-200 ${
                    date.is_cancelled
                      ? 'border-red-500/20 bg-dark-700/30 opacity-60'
                      : 'border-gold-500/20 bg-dark-700 hover:border-gold-500/40 hover:bg-dark-600/50'
                  }`}
                >
                  {/* Date */}
                  <div className="flex-shrink-0 flex items-center gap-4 sm:gap-0 sm:flex-col sm:w-20 sm:text-center">
                    <div className="text-3xl font-display font-black text-gold-400 leading-none">
                      {format(new Date(date.event_date + 'T00:00:00'), 'dd')}
                    </div>
                    <div>
                      <div className="text-sm font-display uppercase tracking-widest text-cream/60">
                        {format(new Date(date.event_date + 'T00:00:00'), 'MMM')}
                      </div>
                      <div className="text-xs text-cream/30">
                        {format(new Date(date.event_date + 'T00:00:00'), 'yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-14 bg-gold-500/15 flex-shrink-0 mx-2" />

                  {/* Location */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-lg font-serif font-semibold text-cream">
                      <MapPin size={16} className="text-gold-400 flex-shrink-0" />
                      {date.city}{date.state ? `, ${date.state}` : ''}, {date.country}
                    </div>
                    <div className="mt-1 text-cream/50 text-sm flex flex-wrap items-center gap-2">
                      <span>{date.venue}</span>
                      {date.event_time && (
                        <>
                          <span className="text-cream/20">·</span>
                          <span className="flex items-center gap-1"><Calendar size={12} />{date.event_time}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {date.is_cancelled ? (
                      <span className="flex items-center gap-2 text-red-400 text-xs font-display uppercase tracking-widest">
                        <XCircle size={14} /> Cancelled
                      </span>
                    ) : date.is_sold_out ? (
                      <span className="px-4 py-2 text-xs font-display uppercase tracking-widest text-cream/40 border border-cream/10 rounded-sm">
                        Sold Out
                      </span>
                    ) : (
                      <Link
                        to={`/tickets/${date.id}`}
                        className="btn-gold py-2.5 px-5 text-xs inline-flex items-center gap-2"
                      >
                        <Ticket size={14} />
                        Get Tickets
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

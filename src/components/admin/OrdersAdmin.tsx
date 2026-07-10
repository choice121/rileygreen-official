import { useEffect, useState } from 'react'
import { Ticket, Search, RefreshCw, Copy, ChevronDown, ChevronUp, DollarSign, Clock, CheckCircle, XCircle, Mail } from 'lucide-react'
import { supabase, TicketOrder, TourDate } from '../../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type OrderRow = TicketOrder & { show?: TourDate }

const STATUSES = ['all', 'reserved', 'contacted', 'processing', 'confirmed', 'cancelled']

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  reserved:   { label: 'Reserved',   color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
  contacted:  { label: 'Contacted',  color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20' },
  processing: { label: 'Processing', color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/20' },
  confirmed:  { label: 'Confirmed',  color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
}

const TICKET_LABELS: Record<string, string> = {
  general: 'General',
  floor: 'Floor',
  vip_experience: 'VIP',
}

const STATUS_FLOW = ['reserved', 'contacted', 'processing', 'confirmed']

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [shows, setShows] = useState<TourDate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilter, setShowFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'created_at', dir: 'desc' })

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('ticket_orders')
      .select('*')
      .order(sort.col as any, { ascending: sort.dir === 'asc' })
    if (data) {
      const { data: showData } = await supabase.from('tour_dates').select('*')
      const showMap = Object.fromEntries((showData ?? []).map((s: TourDate) => [s.id, s]))
      setShows(showData as TourDate[] ?? [])
      setOrders((data as TicketOrder[]).map(o => ({ ...o, show: showMap[o.tour_date_id] })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [sort])

  async function updateStatus(order: OrderRow, newStatus: string) {
    setUpdating(order.id)
    const { error } = await supabase
      .from('ticket_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id)
    if (error) {
      toast.error('Failed to update order')
    } else {
      toast.success(`Order ${order.order_number} → ${newStatus}`)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o))
    }
    setUpdating(null)
  }

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email)
    toast.success('Email copied to clipboard')
  }

  function cycleSort(col: string) {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
  }

  function SortIcon({ col }: { col: string }) {
    if (sort.col !== col) return null
    return sort.dir === 'asc' ? <ChevronUp size={11} className="inline ml-1" /> : <ChevronDown size={11} className="inline ml-1" />
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q || o.customer_name.toLowerCase().includes(q) || o.customer_email.toLowerCase().includes(q) || o.order_number.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchShow = showFilter === 'all' || o.tour_date_id === showFilter
    return matchSearch && matchStatus && matchShow
  })

  // Stats
  const totalRevenue = orders.filter(o => o.status === 'confirmed').reduce((sum, o) => sum + o.total_price, 0)
  const pendingCount = orders.filter(o => ['reserved', 'contacted', 'processing'].includes(o.status)).length
  const confirmedCount = orders.filter(o => o.status === 'confirmed').length
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: Ticket, color: 'text-cream' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-400' },
          { label: 'Confirmed', value: confirmedCount, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-gold-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-dark-800 border border-gold-500/10 rounded-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-cream/40 text-xs font-display uppercase tracking-widest">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className={`font-serif text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
          <input
            type="text"
            placeholder="Search name, email, order #…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-dark-800 border border-gold-500/10 rounded-sm pl-9 pr-4 py-2.5 text-cream text-sm placeholder-cream/25 focus:outline-none focus:border-gold-400/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-dark-800 border border-gold-500/10 rounded-sm px-3 py-2.5 text-cream/70 text-sm focus:outline-none focus:border-gold-400/30"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : STATUS_CONFIG[s]?.label ?? s}</option>)}
        </select>

        <select
          value={showFilter}
          onChange={e => setShowFilter(e.target.value)}
          className="bg-dark-800 border border-gold-500/10 rounded-sm px-3 py-2.5 text-cream/70 text-sm focus:outline-none focus:border-gold-400/30"
        >
          <option value="all">All Shows</option>
          {shows.map(s => (
            <option key={s.id} value={s.id}>{s.city}{s.state ? `, ${s.state}` : ''} — {format(new Date(s.event_date + 'T00:00:00'), 'MMM d, yyyy')}</option>
          ))}
        </select>

        <button onClick={fetchOrders} className="px-4 py-2.5 bg-dark-800 border border-gold-500/10 rounded-sm text-cream/50 hover:text-cream transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-gold-500/10 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold-500/10 bg-dark-900/50">
                <th className="text-left px-4 py-3 text-cream/40 font-display text-xs uppercase tracking-widest cursor-pointer hover:text-cream/60" onClick={() => cycleSort('order_number')}>
                  Order # <SortIcon col="order_number" />
                </th>
                <th className="text-left px-4 py-3 text-cream/40 font-display text-xs uppercase tracking-widest">Customer</th>
                <th className="text-left px-4 py-3 text-cream/40 font-display text-xs uppercase tracking-widest">Show</th>
                <th className="text-left px-4 py-3 text-cream/40 font-display text-xs uppercase tracking-widest">Tickets</th>
                <th className="text-left px-4 py-3 text-cream/40 font-display text-xs uppercase tracking-widest cursor-pointer hover:text-cream/60" onClick={() => cycleSort('total_price')}>
                  Total <SortIcon col="total_price" />
                </th>
                <th className="text-left px-4 py-3 text-cream/40 font-display text-xs uppercase tracking-widest">Status</th>
                <th className="text-left px-4 py-3 text-cream/40 font-display text-xs uppercase tracking-widest cursor-pointer hover:text-cream/60" onClick={() => cycleSort('created_at')}>
                  Date <SortIcon col="created_at" />
                </th>
                <th className="text-right px-4 py-3 text-cream/40 font-display text-xs uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {loading ? (
                Array(5).fill(null).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(null).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-dark-700 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Ticket size={32} className="mx-auto mb-3 text-cream/15" />
                    <p className="text-cream/30 text-sm">No orders found</p>
                  </td>
                </tr>
              ) : filtered.map(order => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.reserved
                const statusIdx = STATUS_FLOW.indexOf(order.status)
                const canAdvance = statusIdx >= 0 && statusIdx < STATUS_FLOW.length - 1
                const nextStatus = canAdvance ? STATUS_FLOW[statusIdx + 1] : null
                const isExp = expanded === order.id

                return (
                  <>
                    <tr
                      key={order.id}
                      className="hover:bg-dark-700/40 transition-colors cursor-pointer"
                      onClick={() => setExpanded(isExp ? null : order.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-display text-xs text-gold-400 font-semibold">{order.order_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-cream text-sm font-medium">{order.customer_name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-cream/40 text-xs truncate max-w-32">{order.customer_email}</p>
                          <button
                            onClick={e => { e.stopPropagation(); copyEmail(order.customer_email) }}
                            className="text-cream/20 hover:text-gold-400 transition-colors flex-shrink-0"
                          >
                            <Copy size={10} />
                          </button>
                        </div>
                        {order.customer_phone && <p className="text-cream/30 text-xs">{order.customer_phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-cream/50 text-xs">
                        {order.show ? (
                          <>
                            <p className="text-cream/70">{order.show.city}{order.show.state ? `, ${order.show.state}` : ''}</p>
                            <p>{format(new Date(order.show.event_date + 'T00:00:00'), 'MMM d, yyyy')}</p>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-cream/70 text-sm">{order.quantity}× {TICKET_LABELS[order.ticket_type] ?? order.ticket_type}</p>
                        <p className="text-cream/30 text-xs">${order.unit_price}/ea</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-cream font-semibold">${order.total_price}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 border text-xs font-display uppercase tracking-widest px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-cream/40 text-xs">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                        <br />
                        <span className="text-cream/25">{format(new Date(order.created_at), 'h:mm a')}</span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {nextStatus && (
                            <button
                              onClick={() => updateStatus(order, nextStatus)}
                              disabled={updating === order.id}
                              className="text-xs font-display uppercase tracking-widest px-3 py-1.5 rounded-sm border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors disabled:opacity-40"
                            >
                              {updating === order.id ? '…' : `→ ${STATUS_CONFIG[nextStatus]?.label}`}
                            </button>
                          )}
                          {order.status !== 'cancelled' && order.status !== 'confirmed' && (
                            <button
                              onClick={() => updateStatus(order, 'cancelled')}
                              disabled={updating === order.id}
                              className="text-xs font-display uppercase tracking-widest px-3 py-1.5 rounded-sm border border-red-400/20 text-red-400/60 hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-40"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExp && (
                      <tr key={order.id + '-exp'} className="bg-dark-900/40">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-cream/30 text-xs font-display uppercase tracking-widest mb-1">Quick Actions</p>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={`mailto:${order.customer_email}?subject=Your Riley Green Tickets — ${order.order_number}`}
                                  className="inline-flex items-center gap-1.5 text-xs border border-gold-500/20 text-gold-400/70 hover:text-gold-400 px-3 py-1.5 rounded-sm transition-colors"
                                >
                                  <Mail size={11} /> Email Customer
                                </a>
                                <button
                                  onClick={() => copyEmail(order.customer_email)}
                                  className="inline-flex items-center gap-1.5 text-xs border border-cream/10 text-cream/40 hover:text-cream px-3 py-1.5 rounded-sm transition-colors"
                                >
                                  <Copy size={11} /> Copy Email
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-cream/30 text-xs font-display uppercase tracking-widest mb-1">Set Status</p>
                              <div className="flex flex-wrap gap-1.5">
                                {STATUS_FLOW.map(s => (
                                  <button
                                    key={s}
                                    onClick={() => updateStatus(order, s)}
                                    disabled={order.status === s || updating === order.id}
                                    className={`text-xs px-2.5 py-1 rounded-sm border transition-colors disabled:opacity-40 ${
                                      order.status === s ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} border-current` : 'border-cream/10 text-cream/40 hover:text-cream'
                                    }`}
                                  >
                                    {STATUS_CONFIG[s].label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-cream/30 text-xs font-display uppercase tracking-widest mb-1">Order ID</p>
                              <p className="text-cream/30 text-xs font-mono break-all">{order.id}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gold-500/10 px-4 py-3 flex items-center justify-between">
            <p className="text-cream/30 text-xs">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
            <p className="text-cream/30 text-xs">Click any row to expand</p>
          </div>
        )}
      </div>
    </div>
  )
}

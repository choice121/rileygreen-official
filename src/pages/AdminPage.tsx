import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Newspaper, Calendar, Music, ShoppingBag, Image, Video, Mail, MessageSquare, Users, LogOut, Menu, X, Ticket } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardOverview from '../components/admin/DashboardOverview'
import NewsAdmin from '../components/admin/NewsAdmin'
import TourAdmin from '../components/admin/TourAdmin'
import AlbumsAdmin from '../components/admin/AlbumsAdmin'
import MerchAdmin from '../components/admin/MerchAdmin'
import GalleryAdmin from '../components/admin/GalleryAdmin'
import VideosAdmin from '../components/admin/VideosAdmin'
import SubscribersAdmin from '../components/admin/SubscribersAdmin'
import ContactAdmin from '../components/admin/ContactAdmin'
import MembersAdmin from '../components/admin/MembersAdmin'
import OrdersAdmin from '../components/admin/OrdersAdmin'

type Tab = 'overview' | 'news' | 'tour' | 'orders' | 'albums' | 'merch' | 'gallery' | 'videos' | 'members' | 'subscribers' | 'contact'

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
  { id: 'news',         label: 'News',         icon: Newspaper },
  { id: 'tour',         label: 'Tour',         icon: Calendar },
  { id: 'orders',       label: 'Ticket Orders', icon: Ticket },
  { id: 'albums',       label: 'Albums',       icon: Music },
  { id: 'merch',        label: 'Merch',        icon: ShoppingBag },
  { id: 'gallery',      label: 'Gallery',      icon: Image },
  { id: 'videos',       label: 'Videos',       icon: Video },
  { id: 'members',      label: 'Members',      icon: Users },
  { id: 'subscribers',  label: 'Subscribers',  icon: Mail },
  { id: 'contact',      label: 'Contact',      icon: MessageSquare },
]

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.is_admin ?? false))
  }, [user])

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const CONTENT: Record<Tab, React.ReactNode> = {
    overview:    <DashboardOverview />,
    news:        <NewsAdmin />,
    tour:        <TourAdmin />,
    orders:      <OrdersAdmin />,
    albums:      <AlbumsAdmin />,
    merch:       <MerchAdmin />,
    gallery:     <GalleryAdmin />,
    videos:      <VideosAdmin />,
    members:     <MembersAdmin />,
    subscribers: <SubscribersAdmin />,
    contact:     <ContactAdmin />,
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-dark-800 border-r border-gold-500/10 flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gold-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif text-gold-400 text-sm">Morgan Wallen</p>
              <p className="text-cream/30 text-xs">Admin Panel</p>
            </div>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-cream/40 hover:text-cream">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setMobileOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all text-left ${
                tab === id
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-cream/50 hover:text-cream hover:bg-dark-700'
              }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gold-500/10">
          <a href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-cream/30 hover:text-cream/60 transition-colors">← View Site</a>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream/40 hover:text-red-400 transition-colors rounded-sm">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-dark-900/80 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 bg-dark-800/90 backdrop-blur border-b border-gold-500/10 flex items-center px-4 gap-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-cream/50 hover:text-cream">
            <Menu size={20} />
          </button>
          <h1 className="font-display text-xs uppercase tracking-widest text-cream/50">
            {NAV_ITEMS.find(n => n.id === tab)?.label}
          </h1>
          <div className="ml-auto text-xs text-cream/30">
            {user.email}
          </div>
        </header>

        {/* Page content */}
        <motion.main
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex-1 p-6"
        >
          {CONTENT[tab]}
        </motion.main>
      </div>
    </div>
  )
}

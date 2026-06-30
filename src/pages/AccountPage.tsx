import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, LogOut, Edit, Ticket, Music } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { PageLoader } from '../components/ui/LoadingSpinner'

export default function AccountPage() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  if (loading) return <PageLoader />
  if (!user) return null

  return (
    <div className="min-h-screen bg-dark-800 pt-24">
      <div className="py-16 px-4 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <p className="section-subtitle mb-4">Welcome Back</p>
          <h1 className="section-title">My Account</h1>
        </div>
      </div>

      <div className="section-padding">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-1 bg-dark-700 gold-border rounded-sm p-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gold-500/10 border-2 border-gold-500/30 flex items-center justify-center mx-auto mb-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={32} className="text-gold-400" />
                )}
              </div>
              <h2 className="font-serif text-xl text-cream mb-1">{profile?.full_name || user.email?.split('@')[0]}</h2>
              <p className="text-cream/40 text-sm">{user.email}</p>
              {profile?.is_admin && (
                <div className="mt-3 inline-block bg-gold-500/20 text-gold-400 text-xs font-display uppercase tracking-widest px-3 py-1 rounded">
                  Admin
                </div>
              )}
              <div className="mt-6 space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-dark-600 hover:bg-dark-500 rounded-sm transition-colors text-cream/70 hover:text-cream text-sm">
                  <Edit size={15} /> Edit Profile
                </button>
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-dark-600 hover:bg-red-500/10 rounded-sm transition-colors text-cream/50 hover:text-red-400 text-sm">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </motion.div>

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 space-y-6"
            >
              {/* Fan perks */}
              <div className="bg-dark-700 gold-border rounded-sm p-6">
                <h3 className="font-serif text-xl text-cream mb-4">Fan Perks</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Ticket, title: 'Presale Access', desc: 'Get early access to tour tickets.' },
                    { icon: Music, title: 'Exclusive Content', desc: 'Members-only music and videos.' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-4 bg-dark-800 rounded-sm border border-gold-500/10 hover:border-gold-500/30 transition-colors cursor-pointer">
                      <Icon size={20} className="text-gold-400 mb-2" />
                      <h4 className="text-cream font-medium text-sm">{title}</h4>
                      <p className="text-cream/40 text-xs mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile info */}
              <div className="bg-dark-700 gold-border rounded-sm p-6">
                <h3 className="font-serif text-xl text-cream mb-4">Account Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gold-500/10">
                    <span className="text-cream/50">Email</span>
                    <span className="text-cream">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gold-500/10">
                    <span className="text-cream/50">Member since</span>
                    <span className="text-cream">{new Date(user.created_at).getFullYear()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-cream/50">Status</span>
                    <span className="text-gold-400 text-xs font-display uppercase tracking-widest">Fan Member</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

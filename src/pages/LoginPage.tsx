import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const initialMode: Mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [confirmEmailSent, setConfirmEmailSent] = useState(false)
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      })
      setLoading(false)
      if (error) {
        toast.error(error.message || 'Failed to send reset email')
      } else {
        setResetSent(true)
        toast.success('Password reset email sent!')
      }
      return
    }

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      setLoading(false)
      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          toast.error('Please confirm your email first — check your inbox.')
        } else if (error.message?.toLowerCase().includes('invalid login')) {
          toast.error('Incorrect email or password.')
        } else {
          toast.error(error.message || 'Login failed')
        }
      } else {
        toast.success('Welcome back! 🤠')
        navigate('/account')
      }
    } else {
      // signup
      if (!fullName.trim()) {
        toast.error('Please enter your name')
        setLoading(false)
        return
      }
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters')
        setLoading(false)
        return
      }

      const { error } = await signUp(email, password, fullName)
      setLoading(false)

      if (error) {
        if (error.message?.toLowerCase().includes('already registered') ||
            error.message?.toLowerCase().includes('user already exists')) {
          toast.error('An account with this email already exists. Try signing in.')
          setMode('login')
        } else if (error.message?.toLowerCase().includes('invalid email')) {
          toast.error('Please enter a valid email address.')
        } else if (error.message?.toLowerCase().includes('password')) {
          toast.error(error.message)
        } else {
          toast.error(error.message || 'Sign up failed — please try again.')
        }
      } else {
        // Check if email confirmation is required (no session yet)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // Email confirmation flow
          setConfirmEmailSent(true)
        } else {
          // Instant access (email confirmation disabled)
          toast.success('Welcome to the fan club! 🤠')
          navigate('/account')
        }
      }
    }
  }

  const inputClass = "w-full bg-dark-900/60 border border-gold-500/20 rounded-sm px-4 py-3 text-cream placeholder-cream/30 focus:outline-none focus:border-gold-400/60 transition-colors text-sm"

  /* ── Email confirmation screen ── */
  if (confirmEmailSent) {
    return (
      <div className="min-h-screen bg-dark-800 pt-24 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl text-cream mb-3">Check your inbox</h1>
          <p className="text-cream/60 text-sm leading-relaxed mb-2">
            We sent a confirmation link to
          </p>
          <p className="text-gold-400 font-display text-sm tracking-wide mb-6">{email}</p>
          <p className="text-cream/40 text-xs leading-relaxed mb-8 max-w-xs mx-auto">
            Click the link in the email to activate your account and get your official fan card.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setConfirmEmailSent(false); setMode('login') }}
              className="btn-outline w-full justify-center text-sm py-3"
            >
              Back to Sign In
            </button>
            <p className="text-cream/30 text-xs">
              Didn't get it? Check your spam folder or{' '}
              <button
                onClick={() => setConfirmEmailSent(false)}
                className="text-gold-400/60 hover:text-gold-400 transition-colors underline underline-offset-2"
              >
                try again
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-800 pt-24 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <span className="shimmer-text font-display text-2xl font-bold uppercase tracking-widest">Riley Green</span>
          </Link>
          <h1 className="font-serif text-3xl text-cream">
            {mode === 'login' ? 'Fan Login' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="mt-2 text-cream/50 text-sm">
            {mode === 'login'
              ? 'Welcome back to the official fan hub.'
              : mode === 'signup'
              ? 'Join the Riley Green fan community.'
              : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        <div className="bg-dark-700 gold-border rounded-sm p-8">
          <AnimatePresence mode="wait">
            {mode === 'forgot' ? (
              <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => { setMode('login'); setResetSent(false) }}
                  className="flex items-center gap-2 text-cream/40 hover:text-gold-400 transition-colors text-xs font-display uppercase tracking-widest mb-6"
                >
                  <ArrowLeft size={13} /> Back to login
                </button>

                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-4">
                      <Mail size={22} className="text-gold-400" />
                    </div>
                    <p className="text-cream/70 text-sm leading-relaxed">
                      A password reset link was sent to{' '}
                      <span className="text-gold-400">{email}</span>. Check your inbox.
                    </p>
                    <button
                      onClick={() => { setMode('login'); setResetSent(false) }}
                      className="mt-6 btn-outline text-sm w-full"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                      Send Reset Link
                    </Button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Tab toggle */}
                <div className="flex mb-8 rounded-sm overflow-hidden border border-gold-500/20">
                  {(['login', 'signup'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2.5 text-xs font-display uppercase tracking-widest transition-all ${
                        mode === m ? 'bg-gold-500 text-dark-900 font-semibold' : 'text-cream/50 hover:text-cream'
                      }`}
                    >
                      {m === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div
                        key="fullname"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Your name"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          className={inputClass}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-cream/50 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-display uppercase tracking-widest text-cream/50">Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-xs text-gold-400/60 hover:text-gold-400 transition-colors font-display uppercase tracking-widest"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <p className="text-cream/30 text-xs mt-1.5">Minimum 8 characters</p>
                    )}
                  </div>

                  <Button type="submit" loading={loading} fullWidth size="lg" className="mt-6">
                    {mode === 'login'
                      ? <><LogIn size={16} /> Sign In</>
                      : <><UserPlus size={16} /> Create Account</>}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-gold-500/10" />
                    <span className="text-cream/30 text-xs uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-gold-500/10" />
                  </div>
                  <button
                    onClick={signInWithGoogle}
                    className="mt-4 w-full flex items-center justify-center gap-3 py-3 border border-gold-500/20 rounded-sm text-cream/70 hover:text-cream hover:border-gold-500/40 transition-all text-sm font-display uppercase tracking-widest"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-cream/30 text-xs">
          By signing up you agree to our{' '}
          <span className="text-gold-400/60 cursor-pointer hover:text-gold-400 transition-colors">Terms of Service</span>
        </p>
      </motion.div>
    </div>
  )
}

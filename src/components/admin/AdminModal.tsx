import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface AdminModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function AdminModal({ open, onClose, title, children, size = 'md' }: AdminModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className={`w-full ${widths[size]} bg-dark-700 border border-gold-500/20 rounded-sm shadow-2xl max-h-[90vh] flex flex-col`}
          >
            <div className="flex items-center justify-between p-5 border-b border-gold-500/10 flex-shrink-0">
              <h3 className="font-serif text-xl text-cream">{title}</h3>
              <button onClick={onClose} className="text-cream/40 hover:text-cream transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

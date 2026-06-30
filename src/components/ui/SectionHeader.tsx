import { motion } from 'framer-motion'

interface SectionHeaderProps {
  subtitle?: string
  title: string
  description?: string
  center?: boolean
}

export default function SectionHeader({ subtitle, title, description, center = true }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className={center ? 'text-center' : ''}
    >
      {subtitle && (
        <p className="section-subtitle mb-4">{subtitle}</p>
      )}
      <h2 className="section-title mb-4">{title}</h2>
      {description && (
        <p className="text-cream/60 max-w-2xl mx-auto text-lg leading-relaxed">
          {description}
        </p>
      )}
      <div className={`mt-6 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent ${center ? '' : 'hidden'}`} />
    </motion.div>
  )
}

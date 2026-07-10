import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, ExternalLink } from 'lucide-react'
import { supabase, MerchItem } from '../../lib/supabase'
import { ikUrl, PLACEHOLDER_IMAGES } from '../../lib/imagekit'
import SectionHeader from '../ui/SectionHeader'

export default function MerchSection() {
  const [items, setItems] = useState<MerchItem[]>([])

  useEffect(() => {
    supabase
      .from('merch_items')
      .select('*')
      .eq('is_available', true)   // removed is_featured filter — show all available items
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setItems(data as MerchItem[]) })
  }, [])

  return (
    <section className="section-padding bg-dark-800">
      <div className="container-xl">
        <SectionHeader subtitle="Official Store" title="Merchandise" description="Gear up with official Riley Green merch." />

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {(items.length ? items : Array(3).fill(null)).map((item, i) => (
            <motion.div
              key={item?.id ?? i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="group bg-dark-700 rounded-sm overflow-hidden card-hover gold-border"
            >
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={item?.image ? ikUrl(item.image) : PLACEHOLDER_IMAGES.merch}
                  alt={item?.name ?? 'Merch'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES.merch }}
                />
                {item && (
                  <div className="absolute inset-0 bg-dark-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <a
                      href={item.shop_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-gold py-2 px-5 text-xs flex items-center gap-2"
                    >
                      <ShoppingBag size={14} />
                      Shop Now
                    </a>
                  </div>
                )}
              </div>
              <div className="p-5">
                {item ? (
                  <>
                    <p className="text-gold-400/70 text-xs font-display uppercase tracking-widest mb-1">{item.category}</p>
                    <h3 className="font-serif text-lg font-semibold text-cream">{item.name}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-gold-400 text-xl font-bold font-display">${item.price.toFixed(2)}</span>
                      <a
                        href={item.shop_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cream/40 hover:text-gold-400 transition-colors flex items-center gap-1 font-display uppercase tracking-wider"
                      >
                        Buy <ExternalLink size={10} />
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-dark-600 rounded w-16" />
                    <div className="h-5 bg-dark-600 rounded w-36" />
                    <div className="h-6 bg-dark-600 rounded w-20" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link to="/merch" className="btn-gold inline-flex items-center gap-2">
            <ShoppingBag size={16} />
            Visit Official Store
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

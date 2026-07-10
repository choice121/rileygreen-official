import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, ExternalLink, Tag } from 'lucide-react'
import { supabase, MerchItem } from '../lib/supabase'
import { ikUrl, PLACEHOLDER_IMAGES } from '../lib/imagekit'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const MERCH_CATS = ['all', 'apparel', 'accessories', 'collectibles']

export default function MerchPage() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('all')

  useEffect(() => {
    const q = supabase.from('merch_items').select('*').eq('is_available', true)
    if (cat !== 'all') q.eq('category', cat)
    q.then(({ data }) => {
      if (data) setItems(data as MerchItem[])
      setLoading(false)
    })
  }, [cat])

  return (
    <div className="min-h-screen bg-dark-800 pt-24">
      <div className="py-20 px-4 bg-dark-900 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none select-none">
          <div className="text-[12rem] font-display font-black text-gold-500 leading-none">MERCH</div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <p className="section-subtitle mb-4">Official Store</p>
          <h1 className="section-title">Merchandise</h1>
          <p className="mt-4 text-cream/50 max-w-xl">Official Riley Green merchandise. All items ship directly from the official store.</p>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-xl">
          <div className="flex flex-wrap gap-2 mb-10">
            {MERCH_CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 text-xs font-display uppercase tracking-widest rounded-sm transition-all ${
                  cat === c ? 'bg-gold-500 text-dark-900' : 'border border-gold-500/20 text-cream/50 hover:border-gold-500/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="group bg-dark-700 rounded-sm overflow-hidden card-hover gold-border"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={item.image ? ikUrl(item.image) : PLACEHOLDER_IMAGES.merch}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES.merch }}
                    />
                    <div className="absolute inset-0 bg-dark-900/0 group-hover:bg-dark-900/60 transition-colors duration-300 flex items-center justify-center">
                      <a
                        href={item.shop_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-gold py-2 px-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2"
                      >
                        <ShoppingBag size={14} /> Shop Now
                      </a>
                    </div>
                    {item.is_featured && (
                      <div className="absolute top-3 left-3 bg-gold-500 text-dark-900 text-xs font-display uppercase tracking-widest px-2 py-1 font-bold">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={12} className="text-gold-400/60" />
                      <span className="text-gold-400/60 text-xs font-display uppercase tracking-widest">{item.category}</span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-cream">{item.name}</h3>
                    {item.description && <p className="mt-1 text-cream/50 text-sm line-clamp-2">{item.description}</p>}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-gold-400 text-2xl font-bold font-display">${item.price.toFixed(2)}</span>
                      <a
                        href={item.shop_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-cream/40 hover:text-gold-400 transition-colors font-display uppercase tracking-wider"
                      >
                        Buy <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
              {items.length === 0 && (
                <div className="col-span-3 text-center py-20 text-cream/40">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-serif text-xl">No items in this category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

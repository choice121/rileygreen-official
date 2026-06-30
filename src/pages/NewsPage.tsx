import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { supabase, NewsPost } from '../lib/supabase'
import { PLACEHOLDER_IMAGES } from '../lib/imagekit'
import { format } from 'date-fns'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const CATEGORIES = ['all', 'news', 'music', 'tour', 'video']

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    const query = supabase.from('news_posts').select('*').eq('is_published', true).order('published_at', { ascending: false })
    if (category !== 'all') query.eq('category', category)
    query.then(({ data }) => {
      if (data) setPosts(data as NewsPost[])
      setLoading(false)
    })
  }, [category])

  return (
    <div className="min-h-screen bg-dark-800 pt-24">
      <div className="relative py-20 px-4 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <p className="section-subtitle mb-4">Latest Updates</p>
          <h1 className="section-title">News</h1>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-xl">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 text-xs font-display uppercase tracking-widest rounded-sm transition-all ${
                  category === cat ? 'bg-gold-500 text-dark-900' : 'border border-gold-500/20 text-cream/50 hover:border-gold-500/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`group bg-dark-700 rounded-sm overflow-hidden card-hover gold-border ${i === 0 ? 'md:col-span-2' : ''}`}
                >
                  <div className={`relative overflow-hidden ${i === 0 ? 'aspect-video' : 'aspect-[4/3]'}`}>
                    <img
                      src={PLACEHOLDER_IMAGES.news}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-gold-500/90 text-dark-900 text-xs font-display uppercase tracking-widest px-2 py-1 font-semibold">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-cream/40 text-xs mb-2 font-display uppercase tracking-widest">
                      {post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : ''}
                    </p>
                    <h2 className={`font-serif font-bold text-cream group-hover:text-gold-400 transition-colors ${i === 0 ? 'text-2xl' : 'text-lg'}`}>
                      {post.title}
                    </h2>
                    {post.excerpt && <p className="mt-2 text-cream/50 text-sm line-clamp-2">{post.excerpt}</p>}
                    <Link
                      to={`/news/${post.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-gold-400 text-xs font-display uppercase tracking-widest hover:gap-3 transition-all"
                    >
                      Read More <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.article>
              ))}
              {posts.length === 0 && (
                <div className="col-span-3 text-center py-20 text-cream/40">
                  <p className="font-serif text-xl">No posts in this category yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

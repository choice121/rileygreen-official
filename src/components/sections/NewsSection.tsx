import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { supabase, NewsPost } from '../../lib/supabase'
import { PLACEHOLDER_IMAGES } from '../../lib/imagekit'
import { format } from 'date-fns'
import SectionHeader from '../ui/SectionHeader'

export default function NewsSection() {
  const [posts, setPosts] = useState<NewsPost[]>([])

  useEffect(() => {
    supabase
      .from('news_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setPosts(data as NewsPost[]) })
  }, [])

  return (
    <section className="section-padding bg-dark-800">
      <div className="container-xl">
        <SectionHeader subtitle="Latest Updates" title="News & Updates" />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {(posts.length ? posts : Array(3).fill(null)).map((post, i) => (
            <motion.article
              key={post?.id ?? i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`group bg-dark-700 rounded-sm overflow-hidden card-hover gold-border ${i === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className={`relative overflow-hidden ${i === 0 ? 'aspect-video' : 'aspect-[4/3]'}`}>
                <img
                  src={PLACEHOLDER_IMAGES.news}
                  alt={post?.title ?? 'News'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 to-transparent" />
                {post && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-gold-500/90 text-dark-900 text-xs font-display uppercase tracking-widest px-2 py-1 font-semibold">
                      {post.category}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6">
                {post ? (
                  <>
                    <p className="text-cream/40 text-xs mb-2 font-display uppercase tracking-wider">
                      {post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : ''}
                    </p>
                    <h3 className={`font-serif font-bold text-cream group-hover:text-gold-400 transition-colors leading-tight ${i === 0 ? 'text-2xl' : 'text-lg'}`}>
                      {post.title}
                    </h3>
                    <p className="mt-2 text-cream/50 text-sm line-clamp-2">{post.excerpt}</p>
                    <Link
                      to={`/news/${post.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-gold-400 text-sm font-display uppercase tracking-widest hover:gap-3 transition-all"
                    >
                      Read More <ArrowRight size={14} />
                    </Link>
                  </>
                ) : (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-dark-600 rounded w-24" />
                    <div className="h-6 bg-dark-600 rounded w-full" />
                    <div className="h-4 bg-dark-600 rounded w-3/4" />
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link to="/news" className="btn-outline">All News</Link>
        </motion.div>
      </div>
    </section>
  )
}

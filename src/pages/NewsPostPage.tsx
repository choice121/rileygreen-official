import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { supabase, NewsPost } from '../lib/supabase'
import { PLACEHOLDER_IMAGES } from '../lib/imagekit'
import { format } from 'date-fns'
import { PageLoader } from '../components/ui/LoadingSpinner'

export default function NewsPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<NewsPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('news_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setPost(data as NewsPost)
        setLoading(false)
      })
  }, [slug])

  if (loading) return <PageLoader />

  if (notFound) return (
    <div className="min-h-screen bg-dark-800 pt-24 flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-4xl text-cream mb-4">Post not found</p>
        <Link to="/news" className="btn-gold text-sm">Back to News</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-800 pt-24">
      {/* Hero image */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src={PLACEHOLDER_IMAGES.news} alt={post?.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/50 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 -mt-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/news" className="inline-flex items-center gap-2 text-cream/40 hover:text-gold-400 transition-colors text-sm mb-8 font-display uppercase tracking-wider">
            <ArrowLeft size={14} /> Back to News
          </Link>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            {post?.category && (
              <span className="flex items-center gap-1 text-xs text-gold-400 font-display uppercase tracking-widest">
                <Tag size={12} />{post.category}
              </span>
            )}
            {post?.published_at && (
              <span className="flex items-center gap-1 text-xs text-cream/40 font-display uppercase tracking-widest">
                <Calendar size={12} />{format(new Date(post.published_at), 'MMMM d, yyyy')}
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold text-cream leading-tight mb-8">
            {post?.title}
          </h1>

          <div className="h-px bg-gradient-to-r from-gold-500/50 to-transparent mb-10" />

          <div
            className="prose prose-invert prose-lg max-w-none text-cream/70 leading-relaxed [&_p]:mb-6 [&_h2]:font-serif [&_h2]:text-cream [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4"
            dangerouslySetInnerHTML={{ __html: post?.content ?? '' }}
          />

          <div className="mt-16 pt-8 border-t border-gold-500/10">
            <Link to="/news" className="btn-outline inline-flex items-center gap-2">
              <ArrowLeft size={14} /> All News
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

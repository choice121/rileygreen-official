import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile }
      albums: { Row: Album }
      tracks: { Row: Track }
      tour_dates: { Row: TourDate }
      news_posts: { Row: NewsPost }
      merch_items: { Row: MerchItem }
      gallery_photos: { Row: GalleryPhoto }
      videos: { Row: Video }
      newsletter_subscribers: { Row: NewsletterSubscriber }
      contact_submissions: { Row: ContactSubmission }
    }
  }
}

export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type Album = {
  id: string
  title: string
  slug: string
  release_date: string | null
  cover_image: string | null
  description: string | null
  spotify_url: string | null
  apple_music_url: string | null
  youtube_url: string | null
  is_published: boolean
  created_at: string
}

export type Track = {
  id: string
  album_id: string | null
  title: string
  track_number: number | null
  duration_seconds: number | null
  spotify_url: string | null
  apple_music_url: string | null
  youtube_url: string | null
  is_published: boolean
  created_at: string
}

export type TourDate = {
  id: string
  event_date: string
  event_time: string | null
  city: string
  state: string | null
  country: string
  venue: string
  ticket_url: string | null
  is_sold_out: boolean
  is_cancelled: boolean
  created_at: string
}

export type NewsPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  category: string
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type MerchItem = {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  category: string | null
  shop_url: string | null
  is_available: boolean
  is_featured: boolean
  created_at: string
}

export type GalleryPhoto = {
  id: string
  title: string | null
  imagekit_path: string
  category: string
  taken_at: string | null
  is_published: boolean
  sort_order: number
  created_at: string
}

export type Video = {
  id: string
  title: string
  description: string | null
  imagekit_path: string | null
  youtube_url: string | null
  thumbnail: string | null
  category: string
  duration_seconds: number | null
  is_published: boolean
  published_at: string
  created_at: string
}

export type NewsletterSubscriber = {
  id: string
  email: string
  first_name: string | null
  is_confirmed: boolean
  confirmation_token: string | null
  confirmed_at: string | null
  subscribed_at: string
}

export type ContactSubmission = {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  inquiry_type: string
  is_read: boolean
  created_at: string
}

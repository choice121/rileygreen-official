export type { Album, Track, TourDate, NewsPost, MerchItem, GalleryPhoto, Video, NewsletterSubscriber, ContactSubmission, Profile } from '../lib/supabase'

export type NavLink = {
  label: string
  href: string
}

export type SocialLink = {
  name: string
  url: string
  icon: string
}

import Hero from '../components/sections/Hero'
import MusicSection from '../components/sections/MusicSection'
import TourSection from '../components/sections/TourSection'
import NewsSection from '../components/sections/NewsSection'
import GallerySection from '../components/sections/GallerySection'
import VideosSection from '../components/sections/VideosSection'
import MerchSection from '../components/sections/MerchSection'
import NewsletterSection from '../components/sections/NewsletterSection'

export default function Home() {
  return (
    <>
      <Hero />
      <MusicSection />
      <TourSection />
      <NewsSection />
      <GallerySection />
      <VideosSection />
      <MerchSection />
      <NewsletterSection />
    </>
  )
}

import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import MusicPage from './pages/MusicPage'
import TourPage from './pages/TourPage'
import NewsPage from './pages/NewsPage'
import NewsPostPage from './pages/NewsPostPage'
import GalleryPage from './pages/GalleryPage'
import VideosPage from './pages/VideosPage'
import MerchPage from './pages/MerchPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-dark-800 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/tour" element={<TourPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsPostPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/merch" element={<MerchPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

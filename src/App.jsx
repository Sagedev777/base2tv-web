import React, { useEffect, useState } from 'react'
import Header          from './components/Header'
import LivePlayer      from './components/LivePlayer'
import TVGuide         from './components/TVGuide'
import NewsSection     from './components/NewsSection'
import VODSection      from './components/VODSection'
import FeaturedSection from './components/FeaturedSection'
import ContactSection  from './components/ContactSection'
import Footer          from './components/Footer'
import AdsBanner       from './components/AdsBanner'
import AdvertiseSection from './components/AdvertiseSection'
import CareersSection  from './components/CareersSection'
import AppDownloadBanner from './components/AppDownloadBanner'
import ArticlePage     from './components/ArticlePage'

function App() {
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // ── Article page: #news-123 ──────────────────────────────
  const newsMatch = route.match(/^#news-(\d+)$/)
  if (newsMatch) {
    return (
      <div className="app-container">
        <Header />
        <main className="main-content">
          <ArticlePage id={newsMatch[1]} />
        </main>
        <Footer />
      </div>
    )
  }

  // ── Full news page: #latest-stories ─────────────────────
  if (route === '#latest-stories') {
    return (
      <div className="app-container">
        <Header />
        <main className="main-content">
          <NewsSection fullPage />
        </main>
        <Footer />
      </div>
    )
  }

  // ── Homepage ─────────────────────────────────────────────
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="live-broadcast-section">
          <div className="player-column">
            <LivePlayer />
          </div>
          <div className="ads-column">
            <AdsBanner position="sidebar" />
          </div>
        </div>
        <TVGuide />
        <NewsSection />
        <FeaturedSection />
        <VODSection />
        <ContactSection />
        <AdvertiseSection />
        <CareersSection />
        <AppDownloadBanner />
      </main>
      <Footer />
    </div>
  )
}

export default App
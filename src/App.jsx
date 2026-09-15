import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar, { MobileBottomNav } from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import TrustallChat from './components/TrustallChat.jsx'
import { ErrorBoundary, NotFound } from './components/ErrorBoundary.jsx'
import { RoleProvider } from './lib/RoleContext.jsx'
import { useProfile } from './lib/useProfile.js'
import { messaging, onMessage } from './lib/firebaseConfig.js'
import { registerPushToken, unregisterPushToken } from './lib/useRegisterPush.js'
import { startPresenceTracking, stopPresenceTracking } from './lib/presenceUtils.js'
import Home from './pages/Home.jsx'
import Admin from './pages/Admin.jsx'
import Terms from './pages/Terms.jsx'
import Privacy from './pages/Privacy.jsx'
import Support from './pages/Support.jsx'
import Auth from './pages/Auth.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Sell from './pages/Sell.jsx'
import Browse from './pages/Browse.jsx'
import Listing from './pages/Listing.jsx'
import SellerProfile, { BuyerProfile } from './pages/SellerProfile.jsx'
import Messages from './pages/Messages.jsx'
import Marketing from './pages/Marketing.jsx'
import Refer from './pages/Refer.jsx'
import Purchases from './pages/Purchases.jsx'
import SavedListings from './pages/SavedListings.jsx'
import Orders, { OrderDetails } from './pages/Orders.jsx'
import About from './pages/About.jsx'
import { BlogList, BlogPost } from './pages/Blog.jsx'
import TrustSafety from './pages/TrustSafety.jsx'
import DisputePage, { MyDisputes } from './pages/Dispute.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function GlobalSetup() {
  const { session, loading } = useProfile()

  // Setup when user logs in
  useEffect(() => {
    if (!session?.user?.id) return

    // Set up presence tracking
    const unsubscribePresence = startPresenceTracking(session.user.id)

    // Request notification permission early (non-blocking)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.log('Notification permission request failed:', err)
      })
    }

    // Register push token (non-blocking, fails silently if permissions denied)
    registerPushToken(session.user.id)

    // Set up foreground message handling
    const unsubscribeMessages = messaging ? onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      const title = payload.notification?.title || payload.data?.title || 'Trustall'
      const body = payload.notification?.body || payload.data?.body || 'You have a new notification'
      // Show both notification-style and data-only foreground FCM payloads.
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192.svg', tag: 'trustall-notification' })
      }
    }) : () => {}

    return () => {
      if (unsubscribePresence) unsubscribePresence()
      unsubscribeMessages()
      stopPresenceTracking()
    }
  }, [session?.user?.id])

  // Cleanup when user logs out
  useEffect(() => {
    if (loading) return // Auth check is still in progress; do not treat this as logout.
    if (session?.user?.id) return // User is logged in, don't cleanup

    // User logged out, unregister push notifications
    const previousUserId = localStorage.getItem('lastUserId')
    if (previousUserId) {
      unregisterPushToken(previousUserId).catch(err => {
        console.log('Failed to unregister push token:', err)
      })
      localStorage.removeItem('lastUserId')
    }
  }, [session, loading])

  // Store current user ID for cleanup
  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem('lastUserId', session.user.id)
    }
  }, [session?.user?.id])

  return null
}

export default function App() {
  return (
    <RoleProvider>
      <ErrorBoundary>
        <GlobalSetup />
        <div className="app-shell flex min-h-screen flex-col bg-surface">
          <Navbar />
          <main className="flex-1 pb-24 md:pb-0">
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/support" element={<Support />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/listing/:slug" element={<Listing />} />
              <Route path="/seller/:handle" element={<SellerProfile />} />
              <Route path="/buyer/:handle" element={<BuyerProfile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:conversationId" element={<Messages />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/refer" element={<Refer />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/saved" element={<SavedListings />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />
              <Route path="/disputes/:disputeId" element={<DisputePage />} />
              <Route path="/disputes" element={<MyDisputes />} />
              <Route path="/trust-safety" element={<TrustSafety />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="*" element={<NotFound message="The page you requested does not exist." />} />
            </Routes>
          </main>
          <MobileBottomNav />
          <Footer />
          <TrustallChat />
        </div>
      </ErrorBoundary>
    </RoleProvider>
  )
}

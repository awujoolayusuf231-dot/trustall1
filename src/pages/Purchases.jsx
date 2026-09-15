import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useProfile } from '../lib/useProfile.js'
import { MessageSquare, CheckCircle, Truck, AlertCircle } from 'lucide-react'

async function uploadAvatar(file, userId) {
  if (!file || !userId) return null
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) {
    console.error('Avatar upload error:', error)
    if ((error.message || '').toLowerCase().includes('bucket')) {
      throw new Error("Storage bucket 'avatars' not found. Create a public bucket named 'avatars' in Supabase storage or run the migration 0005_avatar_storage.sql.")
    }
    throw error
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export default function Purchases() {
  const { session, profile, loading, setProfile } = useProfile()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [downloadUrls, setDownloadUrls] = useState({})
  const [confirmingOrderId, setConfirmingOrderId] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null)
  const [reviewsSubmitted, setReviewsSubmitted] = useState({})

  useEffect(() => {
    setAvatarPreview(profile?.avatar_url || null)
  }, [profile?.avatar_url])

  useEffect(() => {
    if (!loading && !session) navigate('/auth', { state: { redirectTo: '/purchases' } })
  }, [loading, session, navigate])

  useEffect(() => {
    if (!session) return
    loadOrders()
    const channel = supabase
      .channel('orders-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `buyer_id=eq.${session.user.id}` }, loadOrders)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session])

  async function loadOrders() {
    setLoadingOrders(true)
    const { data } = await supabase
      .from('orders')
      .select('*, offer:offer_id(item_title, conversation_id), seller:seller_id(id, business_name, handle)')
      .eq('buyer_id', session.user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoadingOrders(false)

    const digitalOrders = (data || []).filter((o) => o.transaction_type === 'digital_instant' && o.status === 'confirmed')
    for (const o of digitalOrders) {
      const { data: listing } = await supabase.from('listings').select('digital_file_path').eq('seller_id', o.seller_id).limit(1).maybeSingle()
      if (listing?.digital_file_path) {
        const { data: signed } = await supabase.storage.from('digital-products').createSignedUrl(listing.digital_file_path, 60 * 30)
        if (signed) setDownloadUrls((prev) => ({ ...prev, [o.id]: signed.signedUrl }))
      }
    }

    // Check for existing reviews for delivered orders
    if (data && session?.user?.id) {
      const submittedReviews = {}
      for (const order of data) {
        if (['confirmed', 'completed', 'complete'].includes(order.status)) {
          const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('order_id', order.id)
            .eq('reviewer_id', session.user.id)
            .eq('review_type', 'buyer_to_seller')
            .single()
          
          if (existingReview) {
            submittedReviews[order.id] = true
          }
        }
      }
      setReviewsSubmitted(submittedReviews)
    }
  }

  async function confirmDelivery(orderId) {
    setConfirmingOrderId(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', orderId)
      if (error) throw error
      await loadOrders()
    } catch (err) {
      console.error('Failed to confirm delivery:', err)
      alert('Failed to confirm delivery. Please try again.')
    } finally {
      setConfirmingOrderId(null)
    }
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0]
    if (!file || !session?.user?.id) return

    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setAvatarError('')
    setAvatarUploading(true)

    try {
      const avatarUrl = await uploadAvatar(file, session.user.id)
      if (!avatarUrl) throw new Error('Could not create profile image URL.')

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', session.user.id)
        .select()
        .single()

      if (error) throw error

      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      setProfile(data)
      setAvatarPreview(data.avatar_url || avatarUrl)
    } catch (err) {
      console.error('Failed to save profile photo:', err)
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      setAvatarError(err.message || 'Unable to upload your profile photo right now.')
      setAvatarPreview(profile?.avatar_url || null)
    } finally {
      setAvatarUploading(false)
      event.target.value = ''
    }
  }

  function getStatusBadge(status) {
    const badges = {
      paid: { label: 'Payment Confirmed', color: 'bg-blue-100 text-blue-800', icon: '💳' },
      fulfilled: { label: 'In Transit', color: 'bg-amber-100 text-amber-800', icon: '📦' },
      confirmed: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: '✅' },
      disputed: { label: 'Disputed', color: 'bg-red-100 text-red-800', icon: '⚠️' },
    }
    const badge = badges[status] || badges.paid
    return badge
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading || !profile) return <div className="px-6 py-24 text-center text-muted">Loading…</div>

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-seal">Your account</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">My Purchases</h1>
      <p className="mt-2 text-sm text-muted">Manage your orders and confirm deliveries</p>

      <div className="mt-6 rounded-[28px] border border-hairline bg-gradient-to-br from-white via-surfacealt to-white p-5 shadow-[0_18px_50px_-30px_rgba(27,31,59,0.45)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-inksoft font-display text-xl font-bold text-surface ring-2 ring-white shadow-sm">
            {avatarPreview ? (
              <img src={avatarPreview} alt={profile.full_name || 'Profile'} className="h-full w-full object-cover" />
            ) : (
              (profile.full_name || profile.business_name || '?').slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-bold text-ink">{profile.full_name || profile.business_name || 'Your profile'}</p>
            <p className="font-mono text-[11px] text-muted">Update your profile photo anytime</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-hairline bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Profile photo</p>
              <p className="mt-1 text-xs text-muted">Use a clear headshot or brand logo.</p>
            </div>
            {avatarPreview && (
              <img src={avatarPreview} alt="Profile preview" className="h-12 w-12 rounded-full object-cover ring-2 ring-seal/20" />
            )}
          </div>

          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-seal bg-seal/10 px-4 py-3 text-sm font-semibold text-seal transition hover:bg-seal/15">
            <span>Choose photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={avatarUploading}
            />
          </label>

          {avatarUploading && <p className="mt-3 text-sm text-muted">Uploading your photo…</p>}
          {avatarError && <p className="mt-3 text-sm text-marigold-deep">{avatarError}</p>}
        </div>
      </div>

      {loadingOrders && <p className="mt-10 text-muted">Loading…</p>}
      {!loadingOrders && orders.length === 0 && (
        <div className="mt-10 rounded-2xl border border-hairline bg-white p-8 text-center">
          <p className="text-muted">No purchases yet — browse the marketplace to find something.</p>
          <Link
            to="/browse"
            className="mt-4 inline-block rounded-full bg-seal px-6 py-2 font-mono text-xs font-semibold text-surface hover:bg-seal-deep"
          >
            Browse Marketplace
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {orders.map((o) => {
          const badge = getStatusBadge(o.status)
          const isInTransit = o.status === 'fulfilled'
          const isDelivered = o.status === 'confirmed'
          const totalCost = Number(o.amount) + Number(o.delivery_fee) + Number(o.buyer_fee || 100)

          return (
            <div key={o.id} className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-4">
                <div>
                  <p className="font-display text-base font-semibold text-ink">{o.offer?.item_title}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    Order ID: {o.id.substring(0, 8)}... · {formatDate(o.created_at)}
                  </p>
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs font-medium ${badge.color}`}>
                  <span>{badge.icon}</span>
                  {badge.label}
                </div>
              </div>

              {/* Order Details */}
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted">Seller</p>
                  <p className="mt-1 font-display text-sm font-semibold text-ink">{o.seller?.business_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Item Price</p>
                  <p className="mt-1 font-display text-sm font-semibold text-ink">₦{Number(o.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Delivery Fee</p>
                  <p className="mt-1 font-display text-sm font-semibold text-ink">₦{Number(o.delivery_fee).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Total Paid</p>
                  <p className="mt-1 font-display text-sm font-semibold text-ink">₦{totalCost.toLocaleString()}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-6 space-y-2">
                <p className="font-mono text-xs uppercase text-muted">Delivery Status</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-ink">Payment Confirmed</span>
                  </div>
                  {isInTransit && (
                    <>
                      <span className="text-gray-300">→</span>
                      <div className="flex items-center gap-1">
                        <Truck className="h-5 w-5 text-amber-600" />
                        <span className="text-xs text-ink">In Transit</span>
                      </div>
                    </>
                  )}
                  {isDelivered && (
                    <>
                      <span className="text-gray-300">→</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-xs text-ink">Delivered</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-2 border-t border-hairline pt-4">
                <Link
                  to={`/messages/${o.offer?.conversation_id}`}
                  className="flex items-center gap-2 rounded-full border border-seal px-4 py-2 font-mono text-xs font-semibold text-seal hover:bg-seal/5"
                >
                  <MessageSquare className="h-4 w-4" />
                  Contact Seller
                </Link>

                {isInTransit && (
                  <button
                    onClick={() => confirmDelivery(o.id)}
                    disabled={confirmingOrderId === o.id}
                    className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {confirmingOrderId === o.id ? 'Confirming...' : 'Confirm Delivery'}
                  </button>
                )}

                {isDelivered && !reviewsSubmitted[o.id] && (
                  <Link
                    to={`/orders/${o.id}`}
                    className="flex items-center gap-2 rounded-full bg-seal px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-seal-deep"
                  >
                    ⭐ Leave Review
                  </Link>
                )}

                {isDelivered && reviewsSubmitted[o.id] && (
                  <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 font-mono text-xs font-semibold text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    ✓ Thank you for your review
                  </div>
                )}

                {!isDelivered && isDelivered === false && (
                  <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 font-mono text-xs font-semibold text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    Delivery Confirmed
                  </div>
                )}

                {o.status === 'disputed' && (
                  <button className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 font-mono text-xs font-semibold text-red-800 hover:bg-red-200">
                    <AlertCircle className="h-4 w-4" />
                    View Dispute
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

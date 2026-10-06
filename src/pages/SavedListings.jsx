import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookmarkCheck, Trash2 } from 'lucide-react'
import { useProfile } from '../lib/useProfile.js'
import { clearSavedListings, loadSavedListingIds, unsaveListing } from '../lib/listingFeatures.js'
import { supabase } from '../lib/supabaseClient.js'

export default function SavedListings() {
  const { session, loading } = useProfile()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !session) navigate('/auth', { state: { redirectTo: '/saved' } })
  }, [loading, session, navigate])

  useEffect(() => {
    if (!session?.user?.id) return
    async function load() {
      setLoadingListings(true)
      const savedIds = await loadSavedListingIds(session.user.id)
      if (!savedIds.size) {
        setListings([])
        setLoadingListings(false)
        return
      }
      const { data } = await supabase
        .from('listings')
        .select('*, seller:seller_id(id, business_name, handle, verified_seller, avatar_url)')
        .in('id', [...savedIds])
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      setListings(data || [])
      setLoadingListings(false)
    }
    load()
  }, [session?.user?.id])

  async function remove(listingId) {
    await unsaveListing(session.user.id, listingId)
    setListings((current) => current.filter((listing) => listing.id !== listingId))
  }

  async function clearAll() {
    if (!window.confirm('Remove all saved listings from your library?')) return
    setClearing(true)
    setError('')
    try {
      await clearSavedListings(session.user.id)
      setListings([])
    } catch (clearError) {
      console.error('Failed to clear saved listings:', clearError)
      setError('Could not clear saved listings. Please try again.')
    } finally {
      setClearing(false)
    }
  }

  if (loading || !session) return <div className="px-6 py-24 text-center text-muted">Loading saved listings…</div>

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-seal">Your library</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Saved listings</h1>
        </div>
        {listings.length > 0 && (
          <button type="button" onClick={clearAll} disabled={clearing} className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-xs font-semibold text-muted transition hover:border-red-300 hover:text-red-700 disabled:opacity-50">
            <Trash2 size={15} aria-hidden="true" />{clearing ? 'Clearing…' : 'Clear all'}
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {loadingListings && <p className="mt-10 text-muted">Loading saved listings…</p>}
      {!loadingListings && listings.length === 0 && <p className="mt-10 text-muted">You have not saved any listings yet.</p>}
      <div className="listing-grid mt-10 gap-6">
        {listings.map((listing) => (
          <article key={listing.id} className="relative rounded-2xl border border-hairline bg-white p-3 md:p-5">
            <Link to={`/listing/${listing.slug}`} className="block">
              <div className="listing-card-image mb-3 aspect-square rounded-xl bg-surfacealt bg-cover bg-center" style={listing.images?.[0] ? { backgroundImage: `url(${listing.images[0]})` } : undefined} />
              <p className="truncate font-mono text-[10px] text-muted">{listing.category}</p>
              <h2 className="mt-1 truncate font-display text-sm text-ink">{listing.title}</h2>
              <p className="mt-1 font-mono text-xs font-semibold text-ink">₦{Number(listing.price).toLocaleString()}</p>
            </Link>
            <button type="button" onClick={() => remove(listing.id)} aria-label="Remove saved listing" className="absolute right-5 top-5 rounded-full bg-white/90 p-2 text-seal shadow-sm hover:bg-seal hover:text-white">
              <BookmarkCheck className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

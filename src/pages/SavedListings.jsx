import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useProfile } from '../lib/useProfile.js'
import { loadSavedListingIds, unsaveListing } from '../lib/listingFeatures.js'
import { supabase } from '../lib/supabaseClient.js'

export default function SavedListings() {
  const { session, loading } = useProfile()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)

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

  if (loading || !session) return <div className="px-6 py-24 text-center text-muted">Loading saved listings…</div>

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-seal">Your library</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">Saved listings</h1>
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

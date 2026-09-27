import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'

export default function Sellers() {
  const [sellers, setSellers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    async function loadSellers() {
      setLoading(true)
      const [{ data: sellerProfiles, error: sellerError }, { data: listingRows, error: listingsError }] = await Promise.all([
        supabase
        .from('profiles')
        .select('id')
        .eq('is_seller', true)
        .range(0, 4999),
        supabase
          .from('listings')
          .select('seller_id')
          .eq('is_active', true)
          .range(0, 4999),
      ])
      if (sellerError || listingsError) {
        console.error('Failed to find seller accounts:', sellerError || listingsError)
        if (active) {
          setLoadError('Seller directory could not load. Please refresh and try again.')
          setLoading(false)
        }
        return
      }

      const sellerIds = [...new Set([
        ...(sellerProfiles || []).map((seller) => seller.id),
        ...(listingRows || []).map((listing) => listing.seller_id),
      ].filter(Boolean))]
      if (sellerIds.length === 0) {
        if (active) {
          setSellers([])
          setLoadError('')
          setLoading(false)
        }
        return
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, business_name, handle, state, avatar_url, verified_seller, completed_sales_count, avg_rating')
        .in('id', sellerIds)
        .order('business_name', { ascending: true })
      if (active) {
        if (error) {
          console.error('Failed to load seller directory:', error)
          setLoadError('Seller directory could not load. Please refresh and try again.')
        } else {
          setSellers(profiles || [])
          setLoadError('')
        }
        setLoading(false)
      }
    }

    loadSellers()
    return () => { active = false }
  }, [])

  const normalizedSearch = search.trim().toLowerCase()
  const visibleSellers = sellers.filter((seller) => [seller.business_name, seller.handle, seller.state].filter(Boolean).join(' ').toLowerCase().includes(normalizedSearch))

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-seal">Marketplace</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Find a seller</h1>
          <p className="mt-2 text-sm text-muted">Browse every seller registered on Trustall.</p>
        </div>
        <label className="w-full sm:max-w-sm">
          <span className="sr-only">Search sellers</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search seller or state" className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-seal" />
        </label>
      </div>

      {loading && <p className="py-10 text-sm text-muted">Loading sellers…</p>}
      {!loading && loadError && <p role="alert" className="py-10 text-sm text-marigold-deep">{loadError}</p>}
      {!loading && !loadError && visibleSellers.length === 0 && <p className="py-10 text-sm text-muted">No available sellers match that search.</p>}
      <div className="mt-6 divide-y divide-hairline">
        {visibleSellers.map((seller) => (
          <Link key={seller.id} to={`/seller/${seller.handle || seller.id}`} className="flex items-center gap-4 py-4 transition hover:bg-white/60">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-inksoft font-display text-sm font-bold text-surface">
              {seller.avatar_url ? <img src={seller.avatar_url} alt="" className="h-full w-full object-cover" /> : (seller.business_name || 'Seller').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold text-ink">{seller.business_name || 'Seller'}</p>
              <p className="mt-1 truncate font-mono text-xs text-muted">{[seller.state, seller.handle ? `@${seller.handle}` : null].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-lg font-bold text-ink">{Number(seller.completed_sales_count || 0)}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Sales</p>
            </div>
            {seller.verified_seller && <span className="hidden rounded-full bg-seal/10 px-2 py-1 font-mono text-[10px] font-semibold text-seal sm:inline">Verified</span>}
          </Link>
        ))}
      </div>
    </section>
  )
}
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { SealMark } from '../components/Navbar.jsx'

const categories = [
  'Phones & Gadgets', 'Fashion', 'Home & Living', 'Services', 'Vehicles', 'Electronics',
]

const steps = [
  {
    n: '01',
    title: 'Chat before you commit',
    body: 'Message any seller directly from their listing — ask questions, negotiate, share photos, before any money moves.',
  },
  {
    n: '02',
    title: 'Get a clear offer',
    body: 'The seller sends a custom offer card right in the chat — item, price, delivery fee, nothing hidden or assumed.',
  },
  {
    n: '03',
    title: 'Pay, and confirm when it arrives',
    body: "Accept & pay securely. The seller's payout releases once you confirm you received it — or automatically after 3 hours. You still have 2 days to raise a dispute if something's wrong.",
  },
]

export default function Home() {
  const [featuredSellers, setFeaturedSellers] = useState([])

  useEffect(() => {
    async function loadFeaturedSellers() {
      const { data } = await supabase
        .from('profiles')
        .select('id, business_name, avatar_url, handle, verified_seller, seller_level, total_sales_volume, completed_sales_count, avg_rating, state')
        .not('business_name', 'is', null)
        .order('total_sales_volume', { ascending: false })
        .limit(4)
      setFeaturedSellers(data || [])
    }
    loadFeaturedSellers()
  }, [])

  return (
    <div>
      <section className="hero relative overflow-hidden border-b border-hairline">
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="animate-rise flex flex-col justify-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-seal">
              Verified sellers only
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] text-ink md:text-5xl">
              Buy and sell with people you can actually trust.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Chat with sellers, agree on a price, and pay safely — every offer is clear,
              every verified seller stands behind a badge, and your money is protected
              by a real escrow fee, not just a promise.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/browse" className="rounded-full bg-marigold px-7 py-3 font-body text-sm font-semibold text-ink transition hover:bg-marigold-deep">
                Browse listings
              </Link>
              <Link to="/sellers" className="rounded-full border border-ink px-7 py-3 font-body text-sm font-medium text-ink transition hover:border-seal hover:text-seal">
                See all sellers
              </Link>
            </div>
          </div>

          <div className="animate-float flex items-center justify-center">
            <div className="w-full max-w-sm rounded-3xl border border-hairline bg-white/95 p-5 shadow-[0_20px_60px_-15px_rgba(27,31,59,0.25)] backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-hairline pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-inksoft font-display text-sm font-bold text-surface">
                  TA
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-body text-sm font-semibold text-ink">Tunde's Gadgets</p>
                    <SealMark size={15} />
                  </div>
                  <p className="font-mono text-[11px] text-muted">Verified seller</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surfacealt px-4 py-2.5">
                  <p className="text-sm text-ink">Is the iPhone 13 still available?</p>
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-inksoft px-4 py-2.5">
                  <p className="text-sm text-surface">Yes! Clean condition, sending you an offer now 👇</p>
                </div>

                <div className="rounded-2xl border border-marigold/40 bg-marigold/10 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-marigold-deep">Offer</p>
                  <p className="mt-1 font-display text-base font-semibold text-ink">iPhone 13, 128GB</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-xl font-semibold text-ink">₦380,000</span>
                    <span className="font-mono text-xs text-muted">+ ₦2,000 delivery</span>
                  </div>
                  <button className="mt-3 w-full rounded-full bg-seal py-2.5 font-body text-sm font-semibold text-surface transition hover:bg-seal-deep">
                    Accept & Pay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-hairline bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-6 text-center">
          {[
            'ID-verified sellers',
            'Secured by Paystack',
            'Escrow-protected payments',
            'Buyer confirmation before payout',
          ].map((t) => (
            <div key={t} className="flex items-center gap-2 font-mono text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-seal" />
              {t}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-seal">How it works</p>
        <h2 className="mt-3 font-display text-3xl font-bold text-ink">Three steps, nothing hidden.</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-sm text-marigold-deep">{s.n}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="trust" className="border-y border-hairline bg-ink text-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <SealMark size={44} />
              <h2 className="mt-4 font-display text-2xl font-bold">What the seal actually means.</h2>
            </div>
            <p className="md:col-span-2 text-base leading-relaxed text-surface/70">
              A verified badge isn't decoration — it means the seller has submitted a real ID
              (NIN or CAC), a confirmed phone number, and their details have been personally
              reviewed and approved, not auto-generated. Verification is completely free and
              typically takes up to 3 business days.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-seal">Protection</p>
            <Link to="/trust-safety" className="mt-2 inline-block font-display text-3xl font-bold text-ink hover:text-seal">The Trustall Guarantee</Link>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-hairline bg-white p-6 shadow-sm">
            <div className="mb-4 text-2xl">🛡️</div>
            <h3 className="font-display text-xl font-bold text-ink">100% Escrow Protected</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">Your money is held safely in our Paystack vault. We never pay the seller until you confirm you received exactly what you ordered.</p>
          </div>
          <div className="rounded-3xl border border-hairline bg-white p-6 shadow-sm">
            <div className="mb-4 text-2xl">⏱️</div>
            <h3 className="font-display text-xl font-bold text-ink">24-Hour Inspection</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">No more 'What I ordered vs. What I got.' You have a full 24 hours to inspect your item before funds are released.</p>
          </div>
          <div className="rounded-3xl border border-hairline bg-white p-6 shadow-sm">
            <div className="mb-4 text-2xl">⚖️</div>
            <h3 className="font-display text-xl font-bold text-ink">Fair In-App Disputes</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">Issues? Don't argue on WhatsApp. Our unbiased admins step in to review the chat and unboxing videos to ensure fair refunds.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-seal">Featured sellers</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-ink">Trusted sellers buyers keep returning to.</h2>
          </div>
          <Link to="/browse" className="hidden font-mono text-xs text-muted hover:text-seal md:inline-block">Browse all →</Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredSellers.map((seller) => (
            <Link
              key={seller.id}
              to={`/seller/${seller.handle}`}
              className="group rounded-3xl border border-hairline bg-gradient-to-br from-white via-white to-surfacealt p-4 shadow-[0_20px_45px_-28px_rgba(27,31,59,0.45)] transition hover:-translate-y-1 hover:border-seal hover:shadow-[0_24px_48px_-22px_rgba(27,31,59,0.55)]"
            >
              <div className="flex items-center gap-3 border-b border-hairline pb-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-inksoft font-display text-sm font-bold text-surface ring-2 ring-white shadow-sm">
                  {seller.avatar_url ? (
                    <img src={seller.avatar_url} alt={seller.business_name || 'Seller'} className="h-full w-full object-cover" />
                  ) : (
                    (seller.business_name || '?').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-body text-sm font-semibold text-ink">{seller.business_name}</p>
                    {seller.verified_seller && <SealMark size={14} />}
                  </div>
                  <p className="font-mono text-[10px] text-muted">{seller.state}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-marigold/10 px-2 py-1 font-mono text-[10px] font-semibold text-marigold-deep">
                  {seller.avg_rating ? `${Number(seller.avg_rating).toFixed(1)}★` : 'New seller'}
                </span>
                <span className="font-mono text-[10px] text-muted">{seller.handle ? `@${seller.handle}` : 'Verified'}</span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/80 p-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Sales</p>
                  <p className="mt-1 font-display text-lg font-bold text-ink">{Number(seller.completed_sales_count || 0)}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Total</p>
                  <p className="mt-1 font-display text-lg font-bold text-ink">₦{Number(seller.total_sales_volume || 0).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-seal">Browse</p>
        <h2 className="mt-3 font-display text-3xl font-bold text-ink">Find what you need.</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {categories.map((c) => (
            <Link
              to={`/browse?category=${encodeURIComponent(c)}`}
              key={c}
              className="rounded-2xl border border-hairline bg-white p-5 text-center transition hover:border-seal"
            >
              <p className="font-body text-sm font-medium text-ink">{c}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Ready to sell something?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted">
          List your first item, get verified for free, and start chatting with real buyers today.
        </p>
        <Link to="/sell" className="mt-8 inline-block rounded-full bg-marigold px-8 py-3 font-body text-sm font-semibold text-ink transition hover:bg-marigold-deep">
          Start selling
        </Link>
      </section>
    </div>
  )
}

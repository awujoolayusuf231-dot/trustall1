import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useProfile } from '../lib/useProfile.js'

const WHATSAPP_MARKETING_NUMBER = '2347073634507'

export default function Marketing() {
  const { session, profile, loading } = useProfile()
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [loadingPkgs, setLoadingPkgs] = useState(true)

  useEffect(() => {
    if (!loading && !session) navigate('/auth', { state: { redirectTo: '/marketing' } })
  }, [loading, session, navigate])

  useEffect(() => {
    supabase.from('marketing_packages').select('*').eq('is_active', true)
      .order('display_order').then(({ data }) => { setPackages(data || []); setLoadingPkgs(false) })
  }, [])

  if (loading || !profile) return <div className="px-6 py-24 text-center text-muted">Loading…</div>

  if (!profile.verified_seller) {
    return (
      <section className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-seal">Marketing</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink">Verified sellers only</h1>
        <p className="mt-4 text-sm text-muted">
          Paid marketing is available once your seller profile is verified — it's free,
          takes up to 3 business days, and unlocks this page along with your trust badge.
        </p>
        <button
          onClick={() => navigate('/sell')}
          className="mt-6 rounded-full bg-seal px-6 py-2.5 font-body text-sm font-semibold text-surface hover:bg-seal-deep"
        >
          Go to verification
        </button>
      </section>
    )
  }

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm ${profile.business_name || 'a Trustall seller'} and I'd like to talk about running an ad campaign for my listings.`
  )

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-seal">Marketing</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">Get more customers.</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Let the Trustall marketing team run real ad campaigns for your listings on Facebook
        and TikTok. Pick a package below, or message us directly to talk through what's
        right for you — minimum campaign length is always 2 weeks.
      </p>

      {loadingPkgs && <p className="mt-10 text-muted">Loading packages…</p>}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="flex flex-col rounded-2xl border border-hairline bg-white p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-marigold-deep">
              {pkg.platform === 'both' ? 'Facebook + TikTok' : pkg.platform}
            </p>
            <h2 className="mt-2 font-display text-lg text-ink">{pkg.name}</h2>
            <p className="mt-2 flex-1 text-sm text-muted">{pkg.description}</p>
            <p className="mt-4 font-mono text-xl font-semibold text-ink">₦{Number(pkg.price_ngn).toLocaleString()}</p>
            <p className="font-mono text-xs text-muted">{pkg.duration_weeks} weeks minimum</p>
            <a
              href={`https://wa.me/${WHATSAPP_MARKETING_NUMBER}?text=${encodeURIComponent(
                `Hi, I'm ${profile.business_name || 'a Trustall seller'} and I'm interested in the "${pkg.name}" package.`
              )}`}
              target="_blank" rel="noreferrer"
              className="mt-5 rounded-full bg-marigold py-2.5 text-center font-body text-sm font-semibold text-ink hover:bg-marigold-deep"
            >
              Discuss on WhatsApp
            </a>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-hairline p-8 text-center" style={{ backgroundColor: '#F1EEE6' }}>
        <h2 className="font-display text-lg text-ink">Not sure which package fits?</h2>
        <p className="mt-2 text-sm text-muted">Talk directly to the marketing team — no obligation.</p>
        <a
          href={`https://wa.me/${WHATSAPP_MARKETING_NUMBER}?text=${whatsappMessage}`}
          target="_blank" rel="noreferrer"
          className="mt-5 inline-block rounded-full bg-seal px-7 py-3 font-body text-sm font-semibold text-surface hover:bg-seal-deep"
        >
          Chat with the marketing team
        </a>
      </div>
    </section>
  )
}

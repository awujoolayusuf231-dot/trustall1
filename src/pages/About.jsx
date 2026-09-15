import { Link } from 'react-router-dom'
import { SealMark } from '../components/Navbar.jsx'

const values = [
  { t: 'Trust is earned, not assumed', d: 'Every seller badge means a real person reviewed real documents — never an automated rubber stamp.' },
  { t: 'Money follows the deal, not the promise', d: 'Payments move through Paystack, not into a stranger\u2019s personal account. If something goes wrong, there\u2019s a record and a process.' },
  { t: 'Built for how Nigerians actually sell', d: 'WhatsApp-friendly links, chat-first negotiation, and no forcing anyone into a rigid storefront template.' },
]

export default function About() {
  return (
    <div>
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <SealMark size={48} />
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-seal">About Trustall</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink md:text-5xl">
            We built the marketplace we wished existed.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Too many people in Nigeria have been burned buying from a stranger on Instagram
            or WhatsApp Status — no verification, no protection, no recourse when something
            goes wrong. Trustall exists to fix that, without making selling feel like
            paperwork.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-seal">What we believe</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.t}>
              <h2 className="font-display text-lg text-ink">{v.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-hairline" style={{ backgroundColor: '#F1EEE6' }}>
        <div className="mx-auto max-w-4xl px-6 py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-seal">The company</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink">Trustall Technologies Limited</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Trustall is built and operated by Trustall Technologies Limited, a company
            based in Osun State, Nigeria. Trustall is a product of Ecomedge Hub Solutions —
            we build technology for the way Nigerian businesses and individuals actually
            work, not the way software usually assumes they should.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-bold text-ink">Ready to see it for yourself?</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/browse" className="rounded-full bg-marigold px-7 py-3 font-body text-sm font-semibold text-ink hover:bg-marigold-deep">
            Browse the marketplace
          </Link>
          <Link to="/sell" className="rounded-full border border-ink px-7 py-3 font-body text-sm text-ink hover:border-seal hover:text-seal">
            Start selling
          </Link>
        </div>
      </section>
    </div>
  )
}

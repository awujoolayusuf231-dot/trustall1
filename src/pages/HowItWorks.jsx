import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Box, CheckCircle2, CreditCard, MessageCircle, PackageCheck, Search, ShieldCheck, Store, Truck } from 'lucide-react'

const workflows = {
  buyer: {
    label: 'I want to buy',
    title: 'Buy with confidence.',
    description: 'Find what you need, talk directly with the seller, and keep payment protected until your order arrives.',
    action: 'Browse listings',
    href: '/browse',
    steps: [
      { icon: Search, title: 'Find your item', text: 'Browse products and services, compare sellers, and open a conversation to ask questions.' },
      { icon: MessageCircle, title: 'Agree on the details', text: 'Review the seller’s offer, delivery charge, and timing. Share your delivery address securely on the offer.' },
      { icon: CreditCard, title: 'Pay through Trustall', text: 'Pay securely at checkout. Your payment is held while the seller prepares and sends your order.' },
      { icon: PackageCheck, title: 'Confirm delivery', text: 'Check your item, confirm it arrived, and leave a review. Payment is then released to the seller.' },
    ],
  },
  seller: {
    label: 'I want to sell',
    title: 'Sell with trust built in.',
    description: 'Set up your storefront, agree with buyers in chat, and manage protected orders from one place.',
    action: 'Open seller workspace',
    href: '/sell',
    steps: [
      { icon: Store, title: 'Build your storefront', text: 'Create your seller profile, add a photo, and publish clear listings for products or services.' },
      { icon: MessageCircle, title: 'Talk and send an offer', text: 'Answer buyer questions and send an offer with clear pricing and delivery terms.' },
      { icon: ShieldCheck, title: 'Receive a paid order', text: 'Once the buyer pays through Trustall, the order appears in your order management workspace.' },
      { icon: Truck, title: 'Deliver and get paid', text: 'Use the buyer’s shared delivery details, mark the order delivered, and receive your payout after confirmation.' },
    ],
  },
}

export default function HowItWorks() {
  const [audience, setAudience] = useState('buyer')
  const flow = workflows[audience]

  return (
    <main className="bg-white">
      <section className="border-b border-hairline bg-gradient-to-br from-seal-light via-white to-blossom/50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-seal">Trustall, step by step</p>
          <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold text-ink sm:text-5xl">A safer way to trade, for everyone.</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">Choose your side of the marketplace to see how buying and selling work from first message to completed order.</p>
            </div>
            <div className="grid grid-cols-2 rounded-full border border-hairline bg-white p-1" role="tablist" aria-label="Choose your Trustall journey">
              {Object.entries(workflows).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={audience === key}
                  onClick={() => setAudience(key)}
                  className={`rounded-full px-4 py-2.5 text-xs font-semibold transition sm:px-5 ${audience === key ? 'bg-seal text-white' : 'text-muted hover:text-seal'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-9 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-seal"><BadgeCheck size={17} /><span className="font-mono text-[10px] uppercase tracking-[0.22em]">{flow.label}</span></div>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{flow.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{flow.description}</p>
          </div>
          <Link to={flow.href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-seal px-5 py-3 text-sm font-semibold text-white transition hover:bg-seal-deep">
            {flow.action}<ArrowRight size={16} />
          </Link>
        </div>

        <ol className="divide-y divide-hairline">
          {flow.steps.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="grid gap-3 py-6 sm:grid-cols-[56px_44px_minmax(0,1fr)] sm:items-start sm:gap-4 sm:py-7">
                <span className="font-mono text-xs text-muted">0{index + 1}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-seal/10 text-seal"><Icon size={20} aria-hidden="true" /></span>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="border-t border-hairline bg-surfacealt/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-seal" size={18} /><p className="text-sm text-ink"><strong>Keep the important steps on Trustall.</strong> Chat, offers, payment, order status, and delivery confirmation stay together.</p></div>
          <Link to="/trust-safety" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-seal hover:underline">Trust & Safety <ArrowRight size={14} /></Link>
        </div>
      </section>
    </main>
  )
}

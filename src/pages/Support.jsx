import { getSupportEmail } from '../lib/authRedirect'

export default function Support() {
  const supportEmail = getSupportEmail()

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-seal">Support</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-ink">We're here to help.</h1>
      <p className="mt-4 text-muted">
        Whether it's a question about a listing, a payment, or a verification request —
        reach out directly.
      </p>
      <div className="mt-8 flex flex-col items-center gap-2 font-mono text-sm text-muted">
        <a href={`mailto:${supportEmail}`} className="hover:text-seal">{supportEmail}</a>
        <a href="tel:+2348132971076" className="hover:text-seal">0813 297 1076</a>
      </div>

      <div className="mt-14 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-2xl border border-hairline bg-white p-6">
          <h2 className="font-display text-base text-ink">Buyer issues</h2>
          <p className="mt-2 text-sm text-muted">
            Problems with an order, delivery, or a seller — include your order reference
            when you email us. You have up to 2 days from receiving an item to raise a dispute.
          </p>
        </div>
        <div className="rounded-2xl border border-hairline bg-white p-6">
          <h2 className="font-display text-base text-ink">Seller & verification</h2>
          <p className="mt-2 text-sm text-muted">
            Questions about getting verified (free, up to 3 business days), payouts, or
            your account — we typically respond within one business day.
          </p>
        </div>
      </div>
    </section>
  )
}

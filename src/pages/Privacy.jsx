import { getSupportEmail } from '../lib/authRedirect'

export default function Privacy() {
  const supportEmail = getSupportEmail()

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-seal">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-ink">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <div>
          <h2 className="font-display text-lg text-ink">1. What we collect</h2>
          <p className="mt-2">
            Account details, messages, listing content, and — for sellers seeking verification —
            a government ID number and photo of that document.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-ink">2. How verification documents are handled</h2>
          <p className="mt-2">
            Stored in a private, access-controlled location, only viewable by verification
            reviewers. Never shown publicly or shared with other users.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-ink">3. How we use your information</h2>
          <p className="mt-2">
            To operate the marketplace: matching buyers and sellers, processing payments,
            reviewing seller verification, and sending account or order updates.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-ink">4. Payment data</h2>
          <p className="mt-2">
            We never store your card or bank details — all payment processing happens
            directly through Paystack.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-ink">5. NDPA Compliance</h2>
          <p className="mt-2">
            We process personal data in accordance with the Nigeria Data Protection Act 2023.
            You can request a copy or deletion of your data, subject to records we're legally
            required to retain.
          </p>
        </div>
        <p className="border-t border-hairline pt-6">
          For any privacy questions or data requests, contact {supportEmail}.
        </p>
      </div>
    </section>
  )
}

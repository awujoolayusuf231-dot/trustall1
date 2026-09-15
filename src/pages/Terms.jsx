import { getSupportEmail } from '../lib/authRedirect'

export default function Terms() {
  const supportEmail = getSupportEmail()

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-seal">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-ink">
        Terms of Service & Escrow Dispute Policy
      </h1>
      <p className="mt-3 text-sm text-muted">Last updated: {new Date().toLocaleDateString()}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        These Terms of Service constitute a legally binding agreement between you and
        Trustall Technologies Limited ("Trustall", "we", "us", or "our"), governing your
        use of the Trustall platform and its payment systems.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <div>
          <h2 className="font-display text-lg text-ink">1. Account Registration & Eligibility</h2>
          <p className="mt-2">
            To use Trustall, you must be at least 18 years of age and have the legal capacity
            to enter into binding contracts under Nigerian law. By registering as a Buyer or
            Seller, you agree to provide accurate identification and understand that Seller
            accounts may require Government ID (NIN, Driver's License) or CAC Verification
            to receive a Verified Badge.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">2. Platform Fees & Payments</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong className="text-ink">For Buyers:</strong> Using Trustall to chat and purchase items is completely free. You will only pay the agreed-upon item price, delivery fee, and a flat ₦100 Escrow Protection Fee per transaction.</li>
            <li><strong className="text-ink">For Sellers:</strong> Trustall charges a dynamic commission of 5% on the total order value for all completed transactions, capped at a maximum of ₦5,000 per transaction, regardless of the item's total cost. Joining as a vendor and identity verification are both completely free.</li>
            <li><strong className="text-ink">Payment Processing:</strong> All payments are processed securely via Paystack. Sellers connect a Paystack Subaccount, and payouts are routed automatically at checkout, settling to the seller's bank on Paystack's standard settlement schedule.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">3. Payouts & Order Confirmation</h2>
          <p className="mt-2">
            Once a seller marks an order fulfilled, the buyer can confirm receipt directly,
            or the order auto-confirms 3 hours after fulfillment if no action is taken.
            Instant digital products (PDFs, ebooks, templates) are delivered and paid out
            immediately on purchase. Digital services (web development, design, freelance
            work) are considered complete on final handover.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">4. Dispute window</h2>
          <p className="mt-2">
            A buyer has a maximum of 2 days from receiving the item or service to raise a
            dispute — this applies even if the seller's payout has already settled. If a
            dispute is raised, via WhatsApp or directly on the platform, Trustall mediators
            will step in between the buyer and seller, review chat logs, invoice details,
            and any evidence submitted, and work toward a fair resolution. Mediator decisions
            are binding on both parties.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">5. Limitation of Liability</h2>
          <p className="mt-2">Trustall Technologies Limited operates solely as an intermediary marketplace and technology provider.</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>We do not own, manufacture, or stock the items sold by third-party Sellers.</li>
            <li>To the maximum extent permitted by law, Trustall shall not be liable for the quality, safety, or legality of services or physical goods provided by Sellers.</li>
            <li>Our total liability for any claim arising from these Terms or your use of the Platform shall not exceed the greater of the fees paid by you in the 12 months preceding the claim, or NGN 100,000.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">6. Data Privacy & NDPA Compliance</h2>
          <p className="mt-2">
            Trustall takes your privacy seriously. We collect and process personal
            data — including identification documents, chat logs, and transaction
            history — in strict accordance with the Nigeria Data Protection Act 2023
            (NDPA). By using the Platform, you consent to the secure storage of this
            data for the purpose of fraud prevention, account verification, and
            transaction processing. Under the NDPA 2023, you retain the right to
            access, rectify, or request the deletion of your personal data, subject to
            Nigerian financial retention laws.
          </p>
        </div>

        <p className="border-t border-hairline pt-6">
          Questions about these Terms can be sent to {supportEmail}.
        </p>
      </div>
    </section>
  )
}

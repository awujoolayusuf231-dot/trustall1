# Trustall Technologies Limited — Marketplace

React + Vite + Tailwind + Supabase. Peer-to-peer marketplace with verified sellers,
in-chat offers, native Paystack Subaccount payouts, a referral engine, and digital
product support.

## Run it locally

```bash
npm install
npm run dev
```

## ⚠️ Payment setup needed before checkout works

1. **Public key** — replace `VITE_PAYSTACK_PUBLIC_KEY` in `.env` with your real key
2. **Secret key** — Supabase dashboard → Edge Functions → Manage secrets →
   `PAYSTACK_SECRET_KEY` (never in `.env` — server-side only)
3. Confirm **Subaccounts / Split Payments** is approved on your Paystack account

## How payments work

- Sellers connect a bank account in `/sell`, creating a real Paystack Subaccount
- At checkout, Paystack **splits automatically** using the exact fee for that
  transaction (5% of item+delivery, capped at ₦5,000 — never a flat percentage),
  passed via `transaction_charge`. The seller's share settles to their bank on
  Paystack's own standard schedule — Trustall never manually holds or transfers funds.
- Fee visibility is role-based: sellers see their fee/payout, buyers see their
  flat ₦100 fee — never both to both.

## Order status vs. money movement

- **Payout release**: buyer confirms delivery, or auto-releases 3 hours after
  fulfillment (Paystack settles the seller's share on their own schedule regardless)
- **Dispute window**: a separate 2-day clock from receiving the item/service —
  applies even after payout has settled. Trustall mediates via WhatsApp/platform.

## What's live

- Accounts, seller dashboard (profile, free verification, payout connection,
  listings — including instant-digital and service product types)
- Automatic seller level engine (1–3 performance-based, 4 "Pro Vendor" via flat
  ₦5,000 payment)
- Marketplace browse/search, listing detail, public seller profiles (shareable links)
- Real-time multi-thread chat, in-chat offers with role-based fee visibility,
  Paystack checkout
- Reporting + disputes (2-day window) + admin moderation (3-warning suspension)
- Marketing page for verified sellers, referral engine with wallet + auto-credit
  on a referred user's first confirmed order, digital product instant delivery
- About Us, Blog (seeded with 3 posts), veriq-inspired navigation, full legal pages

## Still ahead

1. Automated email for the 3-warning system (needs a service like Resend)
2. In-app "raise a dispute" self-service beyond the current report form
3. Wallet withdrawal flow for referral bonuses (Paystack Transfer to bank)

## Design system

Colors: deep indigo (`ink`), warm off-white (`surface`), marigold (action/price),
forest green (`seal` — reserved for the verified badge). Type: Sora (display),
Plus Jakarta Sans (body), IBM Plex Mono (labels/data).

## Upload attachments (new)

- The repo includes a Supabase Edge Function `upload-proxy` at `supabase/functions/upload-proxy` used to enable real upload progress from the client. It accepts a `file` multipart form field, uploads to the `message-attachments` bucket using the service role key, and returns a public URL.
- A helper script to create required buckets is included at `supabase/scripts/ensure_buckets.js`. Run it with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in your shell:

```bash
node supabase/scripts/ensure_buckets.js
```

Notes:

- The client now posts files to the function URL `${VITE_SUPABASE_URL}/functions/v1/upload-proxy` and tracks progress with XHR.
- Ensure you deploy the Edge Function and provide the `SUPABASE_SERVICE_ROLE_KEY` when running the script or deploying functions.

## Deploying to Hostinger (shared hosting)

1. Build the production bundle locally:

```bash
npm run build
```

2. Verify `dist/` was generated. It contains the static site to upload.

3. Prepare rewrite and headers for Hostinger (Apache). A suitable `.htaccess` is included at `public/.htaccess` and will be copied into `dist/` during the build if `public/` files are preserved.

4. Upload `dist/` to Hostinger:

- Option A — Hostinger File Manager: zip `dist/`, upload via Hostinger Control Panel → File Manager, extract into `public_html` (or the domain folder).
- Option B — FTP/SFTP: use an FTP client (FileZilla) and upload the _contents_ of `dist/` into `public_html`.

5. Environment variables note: Hostinger is static hosting — `VITE_` environment variables must be present at build-time. Set them locally or in your CI before running `npm run build`. Server-only secrets (OpenAI key, Supabase service role) must stay server-side — keep them as Supabase secrets and deploy Edge Functions separately.

6. Deploy the `ai-matchmaker` Supabase Edge Function and set the OpenAI API key as a Supabase secret (do this from a machine with `supabase` CLI authenticated):

```bash
supabase login
supabase secrets set OPENAI_API_KEY="your_openai_api_key"
npm run supabase:deploy-ai-matchmaker
```

7. Verify the site and chat: open your Hostinger domain and test the Trustall AI chat widget.

## Password reset configuration

Set `VITE_PUBLIC_SITE_URL` to the deployed Trustall origin before building, for example:

```bash
VITE_PUBLIC_SITE_URL=https://your-production-domain.example
```

In Supabase Dashboard, open **Authentication → URL Configuration** and add the matching reset route to **Redirect URLs**:

```text
https://your-production-domain.example/reset-password
```

The forgot-password form sends users to `/reset-password` through Supabase Auth. Do not add access tokens or passwords to application storage; Supabase manages the recovery session and token lifecycle.

## PWA / Installable app

This app already includes PWA support:

- `manifest.webmanifest` defines the app name, icons, theme, and standalone display.
- `public/sw.js` registers a service worker and caches the shell assets.
- `index.html` includes the manifest and PWA meta tags.

To install on supported devices, open the site in a browser and look for the install prompt or add-to-home-screen option.

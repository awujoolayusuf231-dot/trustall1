import { Link } from 'react-router-dom'
import { getSupportEmail } from '../lib/authRedirect'
import { SealMark } from './Navbar.jsx'

export default function Footer() {
  const supportEmail = getSupportEmail()
  return (
    <footer className="border-t border-hairline bg-ink text-surface">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <SealMark size={28} />
              <span className="font-display text-lg font-bold">Trustall</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-surface/70">
              A verified, peer-to-peer marketplace for Nigeria. Chat, negotiate, and pay
              safely — every seller stands behind a badge, and every payment is protected.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Instagram" className="text-surface/60 hover:text-surface">Instagram</a>
              <a href="#" aria-label="X" className="text-surface/60 hover:text-surface">X</a>
              <a href="#" aria-label="TikTok" className="text-surface/60 hover:text-surface">TikTok</a>
            </div>
            <p className="mt-5 font-mono text-xs text-surface/50">
              Trustall Technologies Limited — a product by Ecomedge Hub Solutions
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-marigold">Marketplace</p>
            <ul className="mt-4 space-y-2 text-sm text-surface/70">
              <li><Link to="/browse" className="hover:text-surface">Browse listings</Link></li>
              <li><Link to="/sell" className="hover:text-surface">Start selling</Link></li>
              <li><a href="/#trust" className="hover:text-surface">Get verified</a></li>
              <li><Link to="/blog" className="hover:text-surface">Blog</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-marigold">Categories</p>
            <ul className="mt-4 space-y-2 text-sm text-surface/70">
              <li><Link to="/browse?category=Phones%20%26%20Gadgets" className="hover:text-surface">Phones & Gadgets</Link></li>
              <li><Link to="/browse?category=Fashion" className="hover:text-surface">Fashion</Link></li>
              <li><Link to="/browse?category=Freelance%20%26%20Digital%20Services" className="hover:text-surface">Freelance & Digital Services</Link></li>
              <li><Link to="/browse" className="hover:text-surface">All categories</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-marigold">Support & Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-surface/70">
              <li><Link to="/support" className="hover:text-surface">Help & Support</Link></li>
              <li><a href={`mailto:${supportEmail}`} className="hover:text-surface">{supportEmail}</a></li>
              <li><a href="tel:+2348132971076" className="hover:text-surface">0813 297 1076</a></li>
              <li><Link to="/trust-safety" className="hover:text-surface">Trust & Safety</Link></li>
              <li><Link to="/terms" className="hover:text-surface">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-surface">Privacy Policy</Link></li>
              <li><Link to="/privacy" className="hover:text-surface">NDPA Compliance</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-surface/15 pt-6 text-xs text-surface/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Trustall Technologies Limited. All rights reserved.</p>
          <p className="font-mono">Osun State, Nigeria</p>
        </div>
      </div>
    </footer>
  )
}

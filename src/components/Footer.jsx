import { Link } from 'react-router-dom'
import { getSupportEmail } from '../lib/authRedirect'
import { SealMark } from './Navbar.jsx'

export default function Footer() {
  const supportEmail = getSupportEmail()
  return (
    <footer className="border-t border-emerald-700/40 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <SealMark size={28} />
              <span className="font-display text-lg font-bold text-white">Trustall</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-emerald-50/80">
              A verified, peer-to-peer marketplace for Nigeria. Chat, negotiate, and pay
              safely — every seller stands behind a badge, and every payment is protected.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Instagram" className="text-emerald-50/70 transition hover:text-marigold-200">Instagram</a>
              <a href="#" aria-label="X" className="text-emerald-50/70 transition hover:text-marigold-200">X</a>
              <a href="#" aria-label="TikTok" className="text-emerald-50/70 transition hover:text-marigold-200">TikTok</a>
            </div>
            <p className="mt-5 font-mono text-xs text-emerald-100/70">
              Trustall Technologies Limited — a product by Ecomedge Hub Solutions
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-marigold-200">Marketplace</p>
            <ul className="mt-4 space-y-2 text-sm text-emerald-50/80">
              <li><Link to="/browse" className="transition hover:text-white">Browse listings</Link></li>
              <li><Link to="/sell" className="transition hover:text-white">Start selling</Link></li>
              <li><Link to="/how-it-works" className="transition hover:text-white">How it works</Link></li>
              <li><a href="/#trust" className="transition hover:text-white">Get verified</a></li>
              <li><Link to="/blog" className="transition hover:text-white">Blog</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-marigold-200">Categories</p>
            <ul className="mt-4 space-y-2 text-sm text-emerald-50/80">
              <li><Link to="/browse?category=Phones%20%26%20Gadgets" className="transition hover:text-white">Phones & Gadgets</Link></li>
              <li><Link to="/browse?category=Fashion" className="transition hover:text-white">Fashion</Link></li>
              <li><Link to="/browse?category=Freelance%20%26%20Digital%20Services" className="transition hover:text-white">Freelance & Digital Services</Link></li>
              <li><Link to="/browse" className="transition hover:text-white">All categories</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-marigold-200">Support & Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-emerald-50/80">
              <li><Link to="/support" className="transition hover:text-white">Help & Support</Link></li>
              <li><a href={`mailto:${supportEmail}`} className="transition hover:text-white">{supportEmail}</a></li>
              <li><a href="tel:+2348132971076" className="transition hover:text-white">0813 297 1076</a></li>
              <li><Link to="/trust-safety" className="transition hover:text-white">Trust & Safety</Link></li>
              <li><Link to="/terms" className="transition hover:text-white">Terms of Service</Link></li>
              <li><Link to="/privacy" className="transition hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/privacy" className="transition hover:text-white">NDPA Compliance</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-emerald-100/20 pt-6 text-xs text-emerald-100/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Trustall Technologies Limited. All rights reserved.</p>
          <p className="font-mono text-emerald-50/80">Osun State, Nigeria</p>
        </div>
      </div>
    </footer>
  )
}

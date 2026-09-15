import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { getPasswordResetRedirectUrl } from '../lib/authRedirect.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    })

    if (resetError) {
      setError(resetError.message || 'Unable to send the password reset email.')
    } else {
      setSuccess('Check your email for a secure password reset link. The link will expire for your protection.')
    }
    setBusy(false)
  }

  return (
    <section className="mx-auto max-w-sm px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-seal">Account recovery</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">Forgot your password?</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Enter the email linked to your Trustall account and we will send you a secure reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted">Email address</span>
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-seal outline-none"
          />
        </label>

        {error && <p className="text-sm text-marigold-deep">{error}</p>}
        {success && <p className="rounded-xl border border-seal/30 bg-seal/10 px-3 py-3 text-sm text-seal">{success}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-seal py-3 font-body text-sm font-semibold text-surface hover:bg-seal-deep disabled:opacity-50"
        >
          {busy ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>

      <Link to="/auth" className="mt-6 inline-block font-mono text-xs text-muted hover:text-seal">
        ← Back to log in
      </Link>
    </section>
  )
}

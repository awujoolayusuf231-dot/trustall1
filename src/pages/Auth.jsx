import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { useProfile } from '../lib/useProfile.js'
import { getPublicSiteUrl } from '../lib/authRedirect.js'

async function uploadAvatar(file, userId) {
  if (!file || !userId) return null
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) {
    console.error('Avatar upload error:', error)
    if ((error.message || '').toLowerCase().includes('bucket')) {
      throw new Error("Storage bucket 'avatars' not found. Create a public bucket named 'avatars' in Supabase storage or run the migration 0005_avatar_storage.sql.")
    }
    throw error
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { session, loading } = useProfile()
  const redirectTo = location.state?.redirectTo || searchParams.get('redirectTo') || '/'
  const refCode = searchParams.get('ref')

  useEffect(() => {
    if (!loading && session?.user?.id) {
      navigate(redirectTo, { replace: true })
    }
  }, [loading, session?.user?.id, redirectTo, navigate])

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) { setError(error.message); return }
    navigate(redirectTo)
  }

  async function handleGoogleSignIn() {
    setError('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getPublicSiteUrl()}/auth?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) {
      setBusy(false)
      setError(error.message)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, ref_code: refCode || null } },
      })

      if (error) {
        setError(error.message)
        setBusy(false)
        return
      }

      if (data.user?.id && avatarFile) {
        try {
          const avatarUrl = await uploadAvatar(avatarFile, data.user.id)
          if (avatarUrl) {
            await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', data.user.id)
          }
        } catch (uploadErr) {
          console.error('Failed to upload account avatar:', uploadErr)
        }
      }

      setBusy(false)
      if (data.session) {
        navigate(redirectTo)
      } else {
        setInfo('Account created — check your email to confirm, then sign in.')
        setMode('signin')
      }
    } catch (err) {
      setBusy(false)
      setError(err.message || 'Something went wrong while creating your account.')
    }
  }

  if (loading || session?.user?.id) {
    return (
      <section className="mx-auto max-w-sm px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-seal">Trustall</p>
        <p className="mt-3 text-sm text-muted">Finishing sign-in…</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-sm px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-seal">
        {redirectTo !== '/' ? 'One step first' : 'Welcome'}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">
        {mode === 'signin' ? 'Log in to Trustall' : 'Create your account'}
      </h1>
      {mode === 'signup' && refCode && (
        <p className="mt-2 rounded-lg bg-marigold/10 px-3 py-2 font-mono text-xs text-marigold-deep">
          You were invited by a Trustall member 🎉
        </p>
      )}

      <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="mt-8 space-y-4">
        {mode === 'signup' && (
          <>
            <input
              required placeholder="Full name" value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-seal outline-none"
            />
            <div className="rounded-xl border border-hairline bg-white p-3">
              <label className="block text-xs uppercase tracking-[0.2em] text-muted">Profile photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="mt-2 w-full text-sm text-muted"
              />
            </div>
          </>
        )}
        <input
          required type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-seal outline-none"
        />
        <div className="relative">
          <input
            required type={showPassword ? 'text' : 'password'} minLength={6} placeholder="Password" value={password}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-white px-4 py-3 pr-12 text-ink placeholder:text-muted focus:border-seal outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:bg-surfacealt hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-sm text-marigold-deep">{error}</p>}
        {info && <p className="text-sm text-ink">{info}</p>}
        <button
          type="submit" disabled={busy}
          className="w-full rounded-full bg-seal py-3 font-body text-sm font-semibold text-surface hover:bg-seal-deep disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Create account'}
        </button>
      </form>

      {mode === 'signin' && (
        <>
          <div className="mt-4 text-right">
            <Link to="/forgot-password" className="font-mono text-xs text-muted hover:text-seal">
              Forgot password?
            </Link>
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-hairline" />
            <span>or</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-white py-3 font-body text-sm font-semibold text-ink transition hover:border-seal hover:text-seal disabled:opacity-50"
          >
            <span className="font-display text-base font-bold">G</span>
            Continue with Google
          </button>
        </>
      )}

      <button
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}
        className="mt-6 font-mono text-xs text-muted hover:text-seal"
      >
        {mode === 'signin' ? "New to Trustall? Create an account →" : '← Already have an account? Log in'}
      </button>
    </section>
  )
}

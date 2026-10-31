import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { isProfileRpcUnavailable, PUBLIC_PROFILE_COLUMNS } from './profileFields.js'

export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let receivedAuthEvent = false
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      receivedAuthEvent = true
      setSession(s)
      setLoading(false)
    })

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!isMounted || receivedAuthEvent) return
        if (error) {
          console.warn('Session lookup failed:', error)
          setSession(null)
        } else {
          setSession(data.session)
        }
      })
      .catch((error) => {
        if (!isMounted || receivedAuthEvent) return
        console.warn('Session lookup failed:', error)
        setSession(null)
      })
      .finally(() => {
        if (isMounted && !receivedAuthEvent) setLoading(false)
      })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}

export function useProfile() {
  const { session, loading: sessionLoading } = useSession()
  const [profile, setProfile] = useState(null)
  const [profileUserId, setProfileUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(null)

  useEffect(() => {
    if (sessionLoading) return
    if (!session) {
      setProfile(null)
      setProfileUserId(null)
      setProfileError(null)
      setLoading(false)
      return
    }

    let isMounted = true
    setProfile(null)
    setProfileError(null)
    setLoading(true)

    async function loadProfile() {
      const [{ data: rpcProfile, error: rpcError }, { data: contact, error: contactError }] = await Promise.all([
        supabase.rpc('get_my_profile').maybeSingle(),
        supabase
        .from('profile_contacts')
        .select('phone')
        .eq('id', session.user.id)
        .maybeSingle(),
      ])

      if (contactError && contactError.code !== 'PGRST116') {
        console.warn('Contact details lookup failed:', contactError)
      }

      if (!rpcError) return { profile: rpcProfile, phone: contact?.phone ?? null }
      if (!isProfileRpcUnavailable(rpcError)) throw rpcError

      console.warn('Private profile RPC is unavailable; loading public profile fields only.')
      const { data: publicProfile, error: publicProfileError } = await supabase
        .from('profiles')
        .select(PUBLIC_PROFILE_COLUMNS)
        .eq('id', session.user.id)
        .maybeSingle()

      if (publicProfileError) throw publicProfileError
      return { profile: publicProfile, phone: contact?.phone ?? null }
    }

    loadProfile()
      .then(({ profile: loadedProfile, phone }) => {
        if (!isMounted) return

        setProfile(loadedProfile ? { ...loadedProfile, phone } : null)
        setProfileUserId(session.user.id)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('Profile load failed:', error)
        setProfile(null)
        setProfileUserId(session.user.id)
        setProfileError(error)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [session?.user?.id, sessionLoading])

  const profileMatchesSession = Boolean(session?.user?.id) && profileUserId === session.user.id

  return {
    session,
    profile: profileMatchesSession ? profile : null,
    setProfile,
    error: profileError,
    loading: sessionLoading || loading || Boolean(session?.user?.id && !profileMatchesSession),
  }
}

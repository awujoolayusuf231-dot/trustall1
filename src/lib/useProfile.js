import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => setSession(data.session))
      .catch((error) => {
        console.warn('Session lookup failed:', error)
        setSession(null)
      })
      .finally(() => setLoading(false))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return { session, loading }
}

export function useProfile() {
  const { session, loading: sessionLoading } = useSession()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionLoading) return
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }

    let isMounted = true

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return

        if (error && error.code !== 'PGRST116') {
          console.warn('Profile lookup failed:', error)
        }

        setProfile(data ?? null)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('Profile load failed:', error)
        setProfile(null)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [session?.user?.id, sessionLoading])

  return { session, profile, setProfile, loading: sessionLoading || loading }
}

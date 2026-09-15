import { createContext, useContext, useMemo } from 'react'
import { useProfile } from './useProfile.js'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const { session, profile, loading } = useProfile()

  const roleData = useMemo(() => {
    if (!session) {
      return {
        role: 'guest',
        isBuyer: false,
        isSeller: false,
        loading: false,
        session,
        profile,
      }
    }

    const sellerSignals = Boolean(
      profile && (
        profile.verified_seller === true ||
        profile.seller_level === 1 ||
        profile.seller_level === 2 ||
        profile.seller_level === 3 ||
        profile.status === 'seller'
      )
    )

    const nextRole = sellerSignals ? 'seller' : 'buyer'

    return {
      role: nextRole,
      isBuyer: nextRole === 'buyer',
      isSeller: nextRole === 'seller',
      loading,
      session,
      profile,
    }
  }, [loading, session, profile])

  return (
    <RoleContext.Provider value={roleData}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext) || {
    role: 'guest',
    isBuyer: false,
    isSeller: false,
    loading: true,
    session: null,
    profile: null,
  }
}

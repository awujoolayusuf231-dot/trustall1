export function getProfileInitials(profile, authUser = null, fallback = 'U') {
  const metadata = authUser?.user_metadata || {}
  const name = [
    profile?.business_name,
    profile?.full_name,
    metadata.business_name,
    metadata.full_name,
    metadata.name,
    authUser?.email?.split('@')[0],
  ].find((value) => typeof value === 'string' && value.trim())

  if (!name) return fallback

  const parts = name.trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length > 1) {
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
  }
  return name.trim().slice(0, 2).toUpperCase()
}

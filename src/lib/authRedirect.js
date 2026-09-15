export function getPublicSiteUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim()
  if (configuredUrl) return configuredUrl.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'http://localhost:5173'
}

export function getPublicSiteHost() {
  const siteUrl = getPublicSiteUrl()
  try {
    return new URL(siteUrl).host
  } catch {
    if (typeof window !== 'undefined' && window.location?.host) return window.location.host
    return 'localhost:5173'
  }
}

export function getSupportEmail() {
  return import.meta.env.VITE_SUPPORT_EMAIL?.trim() || 'support@trustall.online'
}

export function getPasswordResetRedirectUrl() {
  return `${getPublicSiteUrl()}/reset-password`
}

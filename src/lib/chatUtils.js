export function isMessageUnread(message, lastReadAt) {
  if (!message?.created_at) return false
  if (!lastReadAt) return true
  return new Date(message.created_at).getTime() > new Date(lastReadAt).getTime()
}

export function getUnreadCount(messages, lastReadAt) {
  if (!Array.isArray(messages)) return 0
  return messages.filter((message) => isMessageUnread(message, lastReadAt)).length
}

export function shouldAutoScroll(pane) {
  if (!pane) return true
  const distanceFromBottom = pane.scrollHeight - (pane.scrollTop + pane.clientHeight)
  return distanceFromBottom <= 80
}

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('').slice(0, 2)
}

export function getRelativeTimeLabel(timestamp, now = new Date()) {
  if (!timestamp) return 'just now'

  const diffMs = Math.max(0, new Date(now).getTime() - new Date(timestamp).getTime())
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} mins ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`

  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export function getPresenceLabel(isOnline, lastSeenAt, now = new Date()) {
  if (isOnline) return 'Online'
  if (!lastSeenAt) return 'Offline'
  return `Offline • Last seen ${getRelativeTimeLabel(lastSeenAt, now)}`
}

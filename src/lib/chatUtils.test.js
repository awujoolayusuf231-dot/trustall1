import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getUnreadCount,
  isMessageUnread,
  shouldAutoScroll,
  getInitials,
  getPresenceLabel,
  getRelativeTimeLabel,
} from './chatUtils.js'

test('counts unread messages after a read marker', () => {
  const messages = [
    { id: '1', created_at: '2024-01-01T00:00:00.000Z' },
    { id: '2', created_at: '2024-01-02T00:00:00.000Z' },
    { id: '3', created_at: '2024-01-03T00:00:00.000Z' },
  ]

  assert.equal(getUnreadCount(messages, '2024-01-02T00:00:00.000Z'), 1)
  assert.equal(getUnreadCount(messages, null), 3)
})

test('treats a message as unread until the last read marker passes it', () => {
  const message = { id: '2', created_at: '2024-01-02T00:00:00.000Z' }
  assert.equal(isMessageUnread(message, '2024-01-01T00:00:00.000Z'), true)
  assert.equal(isMessageUnread(message, '2024-01-02T00:00:00.000Z'), false)
})

test('only auto-scrolls when the pane is near the bottom', () => {
  const pane = { scrollHeight: 800, scrollTop: 720, clientHeight: 100 }
  assert.equal(shouldAutoScroll(pane), true)
  assert.equal(shouldAutoScroll({ scrollHeight: 800, scrollTop: 100, clientHeight: 100 }), false)
})

test('builds initials and presence labels for avatars and status text', () => {
  assert.equal(getInitials('Ada Lovelace'), 'AL')
  assert.equal(getInitials('Trustall'), 'T')
  assert.equal(getPresenceLabel(true, null), 'Online')
  assert.equal(getPresenceLabel(false, '2024-01-02T12:00:00.000Z', '2024-01-02T12:30:00.000Z'), 'Offline • Last seen 30 mins ago')
  assert.equal(getRelativeTimeLabel('2024-01-02T12:00:00.000Z', '2024-01-02T12:30:00.000Z'), '30 mins ago')
})

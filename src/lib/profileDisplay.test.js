import test from 'node:test'
import assert from 'node:assert/strict'
import { getProfileInitials } from './profileDisplay.js'

test('uses profile business and personal names for initials', () => {
  assert.equal(getProfileInitials({ business_name: 'Trustall Market', full_name: 'Ada Lovelace' }), 'TM')
  assert.equal(getProfileInitials({ full_name: 'Ada Lovelace' }), 'AL')
  assert.equal(getProfileInitials({ full_name: 'Trustall' }), 'TR')
})

test('falls back to auth metadata and email when profile names are missing', () => {
  assert.equal(getProfileInitials({}, { user_metadata: { name: 'Ada Lovelace' } }), 'AL')
  assert.equal(getProfileInitials({}, { email: 'ada.lovelace@example.com' }), 'AL')
  assert.equal(getProfileInitials({}, null, 'S'), 'S')
})

test('ignores blank profile names and falls back safely', () => {
  assert.equal(getProfileInitials({ business_name: '  ', full_name: '' }, null, 'B'), 'B')
})

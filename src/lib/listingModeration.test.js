import test from 'node:test'
import assert from 'node:assert/strict'

import { buildListingSubmissionPayload } from './listingModeration.js'

test('physical product submissions must go to admin review and stay inactive until approved', () => {
  const payload = buildListingSubmissionPayload({
    title: 'Test product',
    description: 'A product for review',
    price: 25000,
    category: 'Phones & Gadgets',
    productType: 'physical',
    imageUrl: 'https://example.com/image.jpg',
  })

  assert.equal(payload.status, 'pending_review')
  assert.equal(payload.is_active, false)
  assert.equal(payload.moderation_reason, null)
})

test('digital instant listing submissions follow the same admin review path', () => {
  const payload = buildListingSubmissionPayload({
    title: 'Digital pack',
    description: 'A digital file',
    price: 5000,
    category: 'Books & Media',
    productType: 'digital_instant',
  })

  assert.equal(payload.status, 'pending_review')
  assert.equal(payload.is_active, false)
})

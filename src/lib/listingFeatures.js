import { supabase } from './supabaseClient.js'

export async function loadSavedListingIds(userId) {
  if (!userId) return new Set()
  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', userId)

  if (error) {
    console.warn('Saved listings could not be loaded:', error)
    return new Set()
  }

  return new Set((data || []).map((row) => row.listing_id))
}

export async function saveListing(userId, listingId) {
  const { error } = await supabase
    .from('saved_listings')
    .insert({ user_id: userId, listing_id: listingId })

  if (error && error.code !== '23505') throw error
}

export async function unsaveListing(userId, listingId) {
  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId)

  if (error) throw error
}

export async function clearSavedListings(userId) {
  if (!userId) return
  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}

export async function loadRecentlyViewed(userId, limit = 10) {
  if (!userId) return []
  const { data: views, error: viewsError } = await supabase
    .from('recently_viewed')
    .select('listing_id, viewed_at')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(limit)

  if (viewsError || !views?.length) return []

  const ids = views.map((view) => view.listing_id)
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('*, seller:seller_id(id, business_name, handle, verified_seller, avatar_url)')
    .in('id', ids)
    .eq('is_active', true)

  if (listingsError) return []
  const byId = new Map((listings || []).map((listing) => [listing.id, listing]))
  return views.map((view) => ({ ...byId.get(view.listing_id), viewed_at: view.viewed_at })).filter((listing) => listing.id)
}

export async function clearRecentlyViewed(userId) {
  if (!userId) return
  const { error } = await supabase
    .from('recently_viewed')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}

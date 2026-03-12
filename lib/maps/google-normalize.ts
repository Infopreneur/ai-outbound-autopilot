/**
 * lib/maps/google-normalize.ts
 *
 * Converts a raw Google Places result into a flat record
 * ready for insertion into the companies table.
 */

import type { GooglePlace } from './google-places'

export interface NormalizedPlace {
  name: string
  rating: number | null
  review_count: number
  address: string | null
  place_id: string
  city?: string
  phone?: string
  website?: string
}

export function normalizePlace(place: GooglePlace, city?: string): NormalizedPlace {
  return {
    name:         place.name,
    rating:       place.rating        ?? null,
    review_count: place.user_ratings_total ?? 0,
    address:      place.formatted_address ?? null,
    place_id:     place.place_id,
    city:         city,
    phone:        place.formatted_phone_number,
    website:      place.website,
  }
}

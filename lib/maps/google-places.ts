/**
 * lib/maps/google-places.ts
 *
 * Thin wrapper around the Google Places Text Search API.
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 */

export interface GooglePlace {
  name: string
  rating?: number
  user_ratings_total?: number
  formatted_address?: string
  place_id: string
  formatted_phone_number?: string
  website?: string
  types?: string[]
}

export async function searchGooglePlaces({
  niche,
  city,
  maxResults,
}: {
  niche: string
  city: string
  maxResults: number
}): Promise<GooglePlace[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set.')

  const query = `${niche} in ${city}`
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Google Places request failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${data.status} — ${data.error_message ?? ''}`)
  }

  return (data.results as GooglePlace[]).slice(0, maxResults)
}

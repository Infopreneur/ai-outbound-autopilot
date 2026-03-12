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

/**
 * Fetches Google Places Text Search results with automatic pagination.
 * Google returns up to 20 results per page, max 3 pages (60 total).
 * A 2-second delay is required between paginated requests per Google's spec.
 */
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

  const query   = `${niche} in ${city}`
  const results: GooglePlace[] = []
  let pageToken: string | undefined

  do {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.set('query', query)
    url.searchParams.set('key', apiKey)
    if (pageToken) {
      url.searchParams.set('pagetoken', pageToken)
      // Google requires a short delay before the page token becomes valid
      await new Promise((r) => setTimeout(r, 2000))
    }

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Google Places request failed: ${res.status} ${res.statusText}`)

    const data = await res.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} — ${data.error_message ?? ''}`)
    }

    if (Array.isArray(data.results)) results.push(...data.results)
    pageToken = data.next_page_token

  } while (pageToken && results.length < maxResults)

  return results.slice(0, maxResults)
}

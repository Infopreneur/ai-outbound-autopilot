/**
 * lib/maps/maps-search.ts
 *
 * High-level Maps search helper.
 * Generates simulated results and persists them directly to Supabase.
 *
 * Swap the mock generator for a real Google Places API call when ready:
 *   const res = await fetch(`https://places.googleapis.com/v1/places:searchText`, ...)
 */

import { supabaseAdmin } from '@/lib/supabase/server'

export interface MapsSearchResult {
  name: string
  website: string
  phone: string
  rating: number
  review_count: number
  city: string
  state: string | undefined
}

export async function runMapsSearch({
  niche,
  city,
  state,
  maxResults,
}: {
  niche: string
  city: string
  state?: string
  maxResults: number
}): Promise<MapsSearchResult[]> {

  // TEMP: simulated results until real scraper is connected
  const results: MapsSearchResult[] = Array.from({ length: maxResults }, (_, i) => ({
    name:         `${niche} Business ${i + 1}`,
    website:      `https://example${i}.com`,
    phone:        `555-0${String(i).padStart(3, '0')}`,
    rating:       parseFloat((3.5 + ((i * 17) % 15) * 0.1).toFixed(1)),
    review_count: 120 + i,
    city,
    state,
  }))

  // Persist each result to the companies table
  const { error } = await supabaseAdmin
    .from('companies')
    .insert(
      results.map((b) => ({
        name:    b.name,
        website: b.website,
        phone:   b.phone,
        city:    b.city,
        state:   b.state ?? null,
      })),
    )

  if (error) {
    console.error('[runMapsSearch] companies insert failed:', error.message)
  }

  return results
}

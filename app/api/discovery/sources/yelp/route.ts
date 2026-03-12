/**
 * POST /api/discovery/sources/yelp
 *
 * Yelp business discovery — not yet implemented.
 *
 * Planned implementation:
 *  - Apify actor: tri_angle/yelp-scraper
 *  - Input: niche + city → returns businesses with ratings, reviews, phone, website
 *  - Advantage over Google Places: Yelp captures different businesses,
 *    especially restaurants, home services, health/beauty
 *
 * Wire up: lib/discovery/sources/directories.ts → runDirectoriesSource({ directory: 'yelp' })
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Yelp discovery is not yet implemented.',
      hint:  'Coming soon — will use the Apify Yelp Scraper actor.',
    },
    { status: 501 },
  )
}

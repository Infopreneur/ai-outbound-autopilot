/**
 * lib/discovery/sources/apify.ts
 *
 * Apify connector — structured for production use.
 *
 * Real implementation:
 *  npm install apify-client
 *  const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })
 *
 * Currently returns realistic mock data so the UI works without credentials.
 * Each function is a 1:1 replacement target when the real client is wired in.
 */

import type { DiscoveryRunParams, NormalizedCompanyLead, RawScrapeResult } from '../types'
import { normalizeResults } from '../normalize'

// ─── Actor Registry ───────────────────────────────────────────────────────────

export const APIFY_ACTORS = {
  googleMaps:   'compass/google-maps-scraper',
  yelp:         'tri_angle/yelp-scraper',
  yellowPages:  'petr_cermak/yellow-pages-scraper',
  linkedin:     'angelina-tikhonova/linkedin-company-scraper',
} as const

export type ApifyActorKey = keyof typeof APIFY_ACTORS

// ─── Mock data generator ──────────────────────────────────────────────────────

const BUSINESS_TEMPLATES = [
  { suffix: 'Pros',         category: 'Local Business' },
  { suffix: 'Services',     category: 'Local Business' },
  { suffix: 'Solutions',    category: 'Professional Services' },
  { suffix: 'Experts',      category: 'Local Business' },
  { suffix: 'Group',        category: 'Professional Services' },
  { suffix: 'Co.',          category: 'Local Business' },
  { suffix: 'Plus',         category: 'Local Business' },
  { suffix: '& Associates', category: 'Professional Services' },
  { suffix: 'Team',         category: 'Local Business' },
  { suffix: 'Masters',      category: 'Local Business' },
]

function generateMockApifyResults(
  niche: string,
  city: string,
  state: string,
  count: number,
): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => {
    const tmpl      = BUSINESS_TEMPLATES[i % BUSINESS_TEMPLATES.length]
    const bizName   = `${niche} ${tmpl.suffix}`
    const slug      = bizName.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const streetNum = 100 + i * 47

    return {
      title:        bizName,
      website:      `https://${slug}.com`,
      phone:        `+1${String(5550100 + i).padStart(10, '5')}`,
      email:        `info@${slug}.com`,
      address:      `${streetNum} Main Street`,
      city,
      state,
      postalCode:   String(85000 + (i % 100)).padStart(5, '0'),
      categoryName: niche,
      totalScore:   parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      reviewsCount: Math.floor(10 + Math.random() * 190),
      url:          `https://www.google.com/maps/place/${slug}+${city}`,
      linkedInUrl:  undefined,
    }
  })
}

// ─── Core Apify operations ────────────────────────────────────────────────────

async function runActor(
  actorId: string,
  input: Record<string, unknown>,
): Promise<{ runId: string }> {
  await new Promise((r) => setTimeout(r, 400))
  console.log(`[Apify] Would run actor "${actorId}" with input:`, input)
  return { runId: `mock_run_${Date.now()}` }
}

async function fetchDataset(
  runId: string,
  params: { niche: string; city: string; state: string; count: number },
): Promise<Record<string, unknown>[]> {
  await new Promise((r) => setTimeout(r, 300))
  console.log(`[Apify] Fetching dataset for run "${runId}"`)
  return generateMockApifyResults(params.niche, params.city, params.state, params.count)
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface ApifySourceResult {
  leads: NormalizedCompanyLead[]
  runId: string
  rawCount: number
  /** Estimated USD cost (mock: $0.002 per result) */
  estimatedCost: number
}

export async function runApifySource(params: DiscoveryRunParams): Promise<ApifySourceResult> {
  const actorId = APIFY_ACTORS.googleMaps
  const city    = params.city  ?? ''
  const state   = params.state ?? ''
  const max     = params.maxResults ?? 50

  const input: Record<string, unknown> = {
    searchStringsArray:        [`${params.niche} in ${city} ${state}`.trim()],
    maxCrawledPlacesPerSearch: max,
    language:                  'en',
    exportPlaceUrls:           false,
  }

  const { runId } = await runActor(actorId, input)
  const rawData   = await fetchDataset(runId, { niche: params.niche, city, state, count: max })

  const jobId = `job_${Date.now()}`

  const scrapeResult: RawScrapeResult = {
    source:    'apify',
    jobId,
    rawData:   rawData.slice(0, max),
    scrapedAt: new Date().toISOString(),
  }

  const leads         = normalizeResults(scrapeResult)
  const estimatedCost = parseFloat((leads.length * 0.002).toFixed(4))

  return { leads, runId, rawCount: rawData.length, estimatedCost }
}

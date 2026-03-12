/**
 * lib/discovery/sources/linkedin.ts
 *
 * LinkedIn company discovery connector — not yet implemented.
 *
 * Future implementation options:
 *  - Apify actor: angelina-tikhonova/linkedin-company-scraper
 *  - RapidAPI LinkedIn Data API
 *  - Proxycurl API (person + company enrichment)
 *
 * Usage plan:
 *  1. Search LinkedIn for companies matching niche + location
 *  2. Extract: name, website, employee count, industry, HQ location
 *  3. Cross-reference with Maps/Apify leads for enrichment
 */

import type { DiscoveryRunParams, NormalizedCompanyLead } from '../types'

export interface LinkedInSourceResult {
  leads: NormalizedCompanyLead[]
  jobId: string
  rawCount: number
  estimatedCost: number
}

export async function runLinkedInSource(
  _params: DiscoveryRunParams,
): Promise<LinkedInSourceResult> {
  throw new Error(
    'LinkedIn source is not yet implemented. ' +
    'Set up a Proxycurl or Apify LinkedIn actor and wire it in here.',
  )
}

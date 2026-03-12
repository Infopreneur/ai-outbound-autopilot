/**
 * lib/discovery/sources/directories.ts
 *
 * Business directory scraping connector — not yet implemented.
 *
 * Target directories:
 *  - Yelp          (Apify actor: tri_angle/yelp-scraper)
 *  - Yellow Pages  (Apify actor: petr_cermak/yellow-pages-scraper)
 *  - BBB           (Better Business Bureau — custom scraper)
 *  - Angi / HomeAdvisor (home services niche)
 *  - Thumbtack     (home services + professional services)
 *
 * Usage plan:
 *  1. Accept a `directory` param ('yelp' | 'yellowpages' | 'bbb' | 'angi')
 *  2. Dispatch to the correct Apify actor or scraper
 *  3. Normalize results to NormalizedCompanyLead[]
 */

import type { DiscoveryRunParams, NormalizedCompanyLead } from '../types'

export type DirectoryTarget = 'yelp' | 'yellowpages' | 'bbb' | 'angi' | 'thumbtack'

export interface DirectoriesSourceResult {
  leads: NormalizedCompanyLead[]
  jobId: string
  rawCount: number
  estimatedCost: number
  directory: DirectoryTarget
}

export async function runDirectoriesSource(
  _params: DiscoveryRunParams & { directory?: DirectoryTarget },
): Promise<DirectoriesSourceResult> {
  throw new Error(
    'Directory source is not yet implemented. ' +
    'Wire in a Yelp or Yellow Pages Apify actor and normalize results here.',
  )
}

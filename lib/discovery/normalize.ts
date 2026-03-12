/**
 * Normalization layer — converts raw source payloads into a consistent
 * NormalizedCompanyLead shape regardless of which scraper produced them.
 *
 * Adding a new source:
 *  1. Add a case to normalizeResults()
 *  2. Write a normalizeXxxResult() function for its schema
 */

import type {
  RawScrapeResult,
  NormalizedCompanyLead,
  JobSource,
} from './types'
import { normalizeMapsResults } from './maps-normalize'

// ─── Source-specific field shapes ─────────────────────────────────────────────

/** Apify Google Maps Scraper / Yelp Scraper output shape (common fields) */
interface ApifyBusinessRaw {
  title?: string
  name?: string
  website?: string
  phone?: string
  phoneUnformatted?: string
  address?: string
  street?: string
  city?: string
  state?: string
  postalCode?: string
  zip?: string
  categoryName?: string
  categories?: string[]
  totalScore?: number
  stars?: number
  reviewsCount?: number
  reviewCount?: number
  url?: string
  email?: string
  linkedInUrl?: string
  numberOfEmployees?: number
}

/** ScraperAPI / generic CSV row */
interface GenericRaw {
  name?: string
  title?: string
  website?: string
  phone?: string
  city?: string
  state?: string
  industry?: string
  category?: string
  email?: string
}

// ─── Per-source normalizers ───────────────────────────────────────────────────

function normalizeApify(
  raw: Record<string, unknown>,
  jobId: string,
): NormalizedCompanyLead {
  const r = raw as ApifyBusinessRaw

  return {
    id: crypto.randomUUID(),
    name:        (r.title ?? r.name ?? 'Unknown Business').trim(),
    website:     r.website              ?? undefined,
    phone:       r.phone ?? r.phoneUnformatted ?? undefined,
    email:       r.email               ?? undefined,
    address:     r.address ?? r.street ?? undefined,
    city:        r.city                ?? undefined,
    state:       r.state               ?? undefined,
    zip:         r.postalCode ?? r.zip ?? undefined,
    industry:    r.categoryName ?? (Array.isArray(r.categories) ? r.categories[0] : undefined),
    niche:       r.categoryName        ?? undefined,
    rating:      r.totalScore ?? r.stars ?? undefined,
    reviewCount: r.reviewsCount ?? r.reviewCount ?? undefined,
    linkedinUrl: r.linkedInUrl         ?? undefined,
    employeeCount: r.numberOfEmployees ?? undefined,
    sourceJob:   jobId,
    sourceUrl:   r.url                 ?? undefined,
    rawSource:   'apify',
    normalizedAt: new Date().toISOString(),
    enriched:    false,
  }
}

function normalizeGeneric(
  raw: Record<string, unknown>,
  jobId: string,
  source: JobSource,
): NormalizedCompanyLead {
  const r = raw as GenericRaw

  return {
    id:       crypto.randomUUID(),
    name:     (r.name ?? r.title ?? 'Unknown').trim(),
    website:  r.website  ?? undefined,
    phone:    r.phone    ?? undefined,
    email:    r.email    ?? undefined,
    city:     r.city     ?? undefined,
    state:    r.state    ?? undefined,
    industry: r.industry ?? r.category ?? undefined,
    niche:    r.industry ?? r.category ?? undefined,
    sourceJob: jobId,
    rawSource: source,
    normalizedAt: new Date().toISOString(),
    enriched: false,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Convert a RawScrapeResult into an array of NormalizedCompanyLeads.
 * Safe — always returns an array even on malformed input.
 */
export function normalizeResults(
  scrapeResult: RawScrapeResult,
): NormalizedCompanyLead[] {
  const { source, rawData, jobId } = scrapeResult

  if (!Array.isArray(rawData) || rawData.length === 0) return []

  try {
    switch (source) {
      case 'apify':
        return rawData.map((r) => normalizeApify(r, jobId))

      case 'maps':
        return normalizeMapsResults(scrapeResult)

      case 'scraperapi':
      case 'manual':
      case 'csv':
      default:
        return rawData.map((r) => normalizeGeneric(r, jobId, source))
    }
  } catch (err) {
    console.error('[normalize] Failed to normalize results:', err)
    return []
  }
}

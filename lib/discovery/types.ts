// ─── Primitives ───────────────────────────────────────────────────────────────

export type JobStatus  = 'pending' | 'running' | 'completed' | 'failed'
export type JobSource  = 'apify' | 'scraperapi' | 'manual' | 'csv'
export type UsageStatus = 'success' | 'error' | 'timeout'

// ─── Discovery Job ────────────────────────────────────────────────────────────

export interface DiscoveryJob {
  id: string
  source: JobSource
  status: JobStatus
  niche: string
  city?: string
  state?: string
  maxResults: number
  resultsFound: number
  leadsNormalized: number
  /** Estimated USD cost of the scrape run */
  costEstimate: number
  startedAt: string
  completedAt?: string
  error?: string
  /** Apify actor ID used (if source === 'apify') */
  actorId?: string
  /** Apify dataset run ID */
  runId?: string
}

// ─── Scrape Payloads ──────────────────────────────────────────────────────────

/** Raw unprocessed payload from a scraping source */
export interface RawScrapeResult {
  source: JobSource
  jobId: string
  rawData: Record<string, unknown>[]
  scrapedAt: string
}

/** A company lead normalised to a consistent shape across all sources */
export interface NormalizedCompanyLead {
  id: string
  name: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  industry?: string
  niche?: string
  employeeCount?: number
  /** Google / Yelp star rating */
  rating?: number
  reviewCount?: number
  linkedinUrl?: string
  sourceJob: string
  sourceUrl?: string
  rawSource: JobSource
  normalizedAt: string
  enriched: boolean
}

// ─── API Usage Logging ────────────────────────────────────────────────────────

/**
 * One row in the `api_usage_logs` table.
 * Captures every AI or scraper API call for cost monitoring.
 */
export interface ApiUsageLog {
  id: string
  /** e.g. "anthropic", "openai", "apify" */
  provider: string
  /** e.g. "claude-sonnet-4-6", "google-maps-scraper" */
  service: string
  /** e.g. "company-analysis", "lead-discovery", "message-generation" */
  feature: string
  /** Tokens in / records requested / compute units used */
  input_units: number
  /** Tokens out / records returned */
  output_units: number
  /** Estimated USD cost for this call */
  estimated_cost: number
  status: UsageStatus
  created_at: string
  metadata?: Record<string, unknown>
}

// ─── System Health ────────────────────────────────────────────────────────────

export interface SystemHealthMetrics {
  apiSpendToday: number
  apiSpendMonth: number
  totalAiCallsToday: number
  scraperJobsRunning: number
  queueDepth: number
  failedJobs: number
  avgCostPerLead: number
  avgCostPerQualifiedLead: number
  avgCostPerMeetingBooked: number
  recentApiActivity: ApiUsageLog[]
  recentScraperJobs: DiscoveryJob[]
}

// ─── Run Params / Result ──────────────────────────────────────────────────────

export interface DiscoveryRunParams {
  source: JobSource
  niche: string
  city?: string
  state?: string
  maxResults?: number
}

export interface DiscoveryRunResult {
  job: DiscoveryJob
  leads: NormalizedCompanyLead[]
}

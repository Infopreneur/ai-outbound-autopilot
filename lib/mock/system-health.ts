/**
 * Mock system health data.
 * Used by the System Health dashboard page and /api/system/usage when
 * the real Supabase tables are not yet connected.
 */

import type {
  ApiUsageLog,
  DiscoveryJob,
  SystemHealthMetrics,
} from '@/lib/discovery/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minsAgo(n: number) {
  return new Date(Date.now() - n * 60_000).toISOString()
}
function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3_600_000).toISOString()
}

// ─── Recent API Activity ──────────────────────────────────────────────────────

export const mockApiUsageLogs: ApiUsageLog[] = [
  {
    id: 'log_001',
    provider: 'anthropic',
    service: 'claude-sonnet-4-6',
    feature: 'company-analysis',
    input_units: 842,
    output_units: 328,
    estimated_cost: 0.007462,
    status: 'success',
    created_at: minsAgo(4),
  },
  {
    id: 'log_002',
    provider: 'apify',
    service: 'google-maps-scraper',
    feature: 'lead-discovery',
    input_units: 0,
    output_units: 50,
    estimated_cost: 0.1,
    status: 'success',
    created_at: minsAgo(15),
  },
  {
    id: 'log_003',
    provider: 'anthropic',
    service: 'claude-sonnet-4-6',
    feature: 'message-generation',
    input_units: 1240,
    output_units: 456,
    estimated_cost: 0.01062,
    status: 'success',
    created_at: minsAgo(32),
  },
  {
    id: 'log_004',
    provider: 'anthropic',
    service: 'claude-sonnet-4-6',
    feature: 'demo-context',
    input_units: 680,
    output_units: 290,
    estimated_cost: 0.006390,
    status: 'success',
    created_at: minsAgo(55),
  },
  {
    id: 'log_005',
    provider: 'apify',
    service: 'google-maps-scraper',
    feature: 'lead-discovery',
    input_units: 0,
    output_units: 35,
    estimated_cost: 0.07,
    status: 'error',
    created_at: minsAgo(78),
  },
  {
    id: 'log_006',
    provider: 'anthropic',
    service: 'claude-sonnet-4-6',
    feature: 'company-analysis',
    input_units: 920,
    output_units: 380,
    estimated_cost: 0.008460,
    status: 'success',
    created_at: hoursAgo(2),
  },
  {
    id: 'log_007',
    provider: 'apify',
    service: 'yellow-pages-scraper',
    feature: 'lead-discovery',
    input_units: 0,
    output_units: 80,
    estimated_cost: 0.16,
    status: 'success',
    created_at: hoursAgo(3),
  },
  {
    id: 'log_008',
    provider: 'anthropic',
    service: 'claude-sonnet-4-6',
    feature: 'message-generation',
    input_units: 1100,
    output_units: 410,
    estimated_cost: 0.009450,
    status: 'success',
    created_at: hoursAgo(4),
  },
  {
    id: 'log_009',
    provider: 'anthropic',
    service: 'claude-haiku-4-5',
    feature: 'lead-scoring',
    input_units: 420,
    output_units: 110,
    estimated_cost: 0.000243,
    status: 'success',
    created_at: hoursAgo(5),
  },
  {
    id: 'log_010',
    provider: 'apify',
    service: 'yelp-scraper',
    feature: 'lead-discovery',
    input_units: 0,
    output_units: 60,
    estimated_cost: 0.12,
    status: 'timeout',
    created_at: hoursAgo(6),
  },
]

// ─── Recent Scraper Jobs ──────────────────────────────────────────────────────

export const mockDiscoveryJobs: DiscoveryJob[] = [
  {
    id: 'job_001',
    source: 'apify',
    status: 'running',
    niche: 'Roofing Contractors',
    city: 'Phoenix',
    state: 'AZ',
    maxResults: 100,
    resultsFound: 67,
    leadsNormalized: 67,
    costEstimate: 0.134,
    startedAt: minsAgo(5),
    actorId: 'compass/google-maps-scraper',
  },
  {
    id: 'job_002',
    source: 'apify',
    status: 'completed',
    niche: 'HVAC Services',
    city: 'Dallas',
    state: 'TX',
    maxResults: 50,
    resultsFound: 50,
    leadsNormalized: 48,
    costEstimate: 0.10,
    startedAt: minsAgo(45),
    completedAt: minsAgo(38),
    actorId: 'compass/google-maps-scraper',
  },
  {
    id: 'job_003',
    source: 'apify',
    status: 'failed',
    niche: 'Dental Clinics',
    city: 'Miami',
    state: 'FL',
    maxResults: 75,
    resultsFound: 0,
    leadsNormalized: 0,
    costEstimate: 0,
    startedAt: hoursAgo(2),
    completedAt: new Date(Date.now() - 2 * 3_600_000 + 8_000).toISOString(),
    error: 'Actor rate limit exceeded — retry in 15m',
  },
  {
    id: 'job_004',
    source: 'apify',
    status: 'completed',
    niche: 'Plumbers',
    city: 'Chicago',
    state: 'IL',
    maxResults: 100,
    resultsFound: 100,
    leadsNormalized: 97,
    costEstimate: 0.20,
    startedAt: hoursAgo(5),
    completedAt: new Date(Date.now() - 5 * 3_600_000 + 45 * 60_000).toISOString(),
    actorId: 'compass/google-maps-scraper',
  },
  {
    id: 'job_005',
    source: 'apify',
    status: 'completed',
    niche: 'Auto Repair Shops',
    city: 'Atlanta',
    state: 'GA',
    maxResults: 50,
    resultsFound: 50,
    leadsNormalized: 50,
    costEstimate: 0.10,
    startedAt: hoursAgo(8),
    completedAt: new Date(Date.now() - 8 * 3_600_000 + 50 * 60_000).toISOString(),
    actorId: 'compass/google-maps-scraper',
  },
  {
    id: 'job_006',
    source: 'apify',
    status: 'pending',
    niche: 'Landscaping Services',
    city: 'Denver',
    state: 'CO',
    maxResults: 75,
    resultsFound: 0,
    leadsNormalized: 0,
    costEstimate: 0,
    startedAt: minsAgo(1),
  },
]

// ─── Aggregate metrics ────────────────────────────────────────────────────────

const totalLeadsFromLogs = mockDiscoveryJobs
  .filter((j) => j.status === 'completed')
  .reduce((s, j) => s + j.leadsNormalized, 0)

const totalCostFromJobs = mockDiscoveryJobs
  .filter((j) => j.status === 'completed')
  .reduce((s, j) => s + j.costEstimate, 0)

export const mockSystemHealthMetrics: SystemHealthMetrics = {
  apiSpendToday:      parseFloat(mockApiUsageLogs.slice(0, 6).reduce((s, l) => s + l.estimated_cost, 0).toFixed(4)),
  apiSpendMonth:      14.87,
  totalAiCallsToday:  mockApiUsageLogs.filter((l) => l.provider === 'anthropic').length,
  scraperJobsRunning: mockDiscoveryJobs.filter((j) => j.status === 'running').length,
  queueDepth:         mockDiscoveryJobs.filter((j) => j.status === 'pending').length,
  failedJobs:         mockDiscoveryJobs.filter((j) => j.status === 'failed').length,
  avgCostPerLead:     totalLeadsFromLogs > 0
    ? parseFloat((totalCostFromJobs / totalLeadsFromLogs).toFixed(4))
    : 0.0028,
  recentApiActivity:  mockApiUsageLogs,
  recentScraperJobs:  mockDiscoveryJobs,
}

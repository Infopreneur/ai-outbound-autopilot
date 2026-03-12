/**
 * Discovery Job Runner — orchestrates a full lead discovery pipeline run.
 *
 * Maintains an in-memory job store (swap for Supabase when ready).
 * Dispatches to the correct source connector based on DiscoveryRunParams.source.
 */

import type {
  DiscoveryJob,
  DiscoveryRunParams,
  DiscoveryRunResult,
  JobStatus,
} from './types'
import { runApifySource } from './sources/apify'
import { runMapsSource }  from './sources/maps'

// ─── In-memory store (replace with Supabase) ─────────────────────────────────

const jobStore = new Map<string, DiscoveryJob>()

function makeJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Store accessors ──────────────────────────────────────────────────────────

export function getJob(id: string): DiscoveryJob | undefined {
  return jobStore.get(id)
}

export function getAllJobs(): DiscoveryJob[] {
  return [...jobStore.values()].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
}

export function getJobsByStatus(status: JobStatus): DiscoveryJob[] {
  return getAllJobs().filter((j) => j.status === status)
}

// ─── Runner ───────────────────────────────────────────────────────────────────

/**
 * Create, execute, and persist a discovery job.
 *
 * @param params - What to search for and where
 * @returns Completed job record + normalized leads
 * @throws On connector failure (job is marked failed in store)
 */
export async function runDiscoveryJob(
  params: DiscoveryRunParams,
): Promise<DiscoveryRunResult> {
  const id = makeJobId()

  // Register job as running
  const job: DiscoveryJob = {
    id,
    source:           params.source,
    status:           'running',
    niche:            params.niche,
    city:             params.city,
    state:            params.state,
    maxResults:       params.maxResults ?? 50,
    resultsFound:     0,
    leadsNormalized:  0,
    costEstimate:     0,
    startedAt:        new Date().toISOString(),
  }
  jobStore.set(id, job)

  try {
    let leads = []
    let costEstimate = 0
    let runId: string | undefined

    switch (params.source) {
      case 'apify': {
        const result = await runApifySource(params)
        leads        = result.leads
        costEstimate = result.estimatedCost
        runId        = result.runId
        job.actorId  = 'compass/google-maps-scraper'
        job.runId    = runId
        break
      }

      case 'maps': {
        const result = await runMapsSource(params)
        leads        = result.leads
        costEstimate = result.estimatedCost
        job.runId    = result.jobId
        break
      }

      // Future connectors slot in here
      case 'scraperapi':
      case 'manual':
      case 'csv':
      default:
        throw new Error(`Source "${params.source}" is not yet implemented.`)
    }

    // Mark complete
    job.status          = 'completed'
    job.resultsFound    = leads.length
    job.leadsNormalized = leads.length
    job.costEstimate    = costEstimate
    job.completedAt     = new Date().toISOString()
    jobStore.set(id, job)

    return { job, leads }
  } catch (err) {
    // Mark failed — do not rethrow silently
    job.status      = 'failed'
    job.error       = err instanceof Error ? err.message : 'Unknown error'
    job.completedAt = new Date().toISOString()
    jobStore.set(id, job)
    throw err
  }
}

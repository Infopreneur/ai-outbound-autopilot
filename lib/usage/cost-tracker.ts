/**
 * API Cost Tracker
 *
 * Logs every AI / scraper API call with provider, service, feature,
 * token counts, and estimated USD cost.
 *
 * Storage: in-memory ring buffer (cap 1000).
 * TODO: persist to Supabase `api_usage_logs` table on each write.
 */

import type { ApiUsageLog, UsageStatus } from '@/lib/discovery/types'
import { supabaseAdmin } from '@/lib/supabase/server'

// ─── Cost rate table (USD per unit) ──────────────────────────────────────────
// Input / output rates keyed as `${provider}.${service}-input/output`.
// For non-LLM providers (Apify) use a flat per-result rate.

const RATES: Record<string, number> = {
  // Anthropic Claude Sonnet 4.6
  'anthropic.claude-sonnet-4-6-input':   3.00  / 1_000_000,  // $3 / 1M tokens
  'anthropic.claude-sonnet-4-6-output':  15.00 / 1_000_000,  // $15 / 1M tokens

  // Anthropic Claude Haiku 4.5
  'anthropic.claude-haiku-4-5-input':    0.25  / 1_000_000,
  'anthropic.claude-haiku-4-5-output':   1.25  / 1_000_000,

  // OpenAI GPT-4o
  'openai.gpt-4o-input':                 5.00  / 1_000_000,
  'openai.gpt-4o-output':                15.00 / 1_000_000,

  // Apify (per result record)
  'apify.google-maps-scraper':           0.002,
  'apify.yelp-scraper':                  0.002,
  'apify.yellow-pages-scraper':          0.002,
}

function getRate(provider: string, service: string, direction: 'input' | 'output'): number {
  return (
    RATES[`${provider}.${service}-${direction}`] ??
    RATES[`${provider}.${service}`] ??           // flat-rate (Apify)
    0
  )
}

// ─── In-memory ring buffer ────────────────────────────────────────────────────

const LOG_CAP  = 1_000
const logBuffer: ApiUsageLog[] = []

function pushLog(entry: ApiUsageLog) {
  logBuffer.unshift(entry)
  if (logBuffer.length > LOG_CAP) logBuffer.pop()
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface LogUsageParams {
  provider: string
  service: string
  feature: string
  input_units: number
  output_units: number
  status?: UsageStatus
  metadata?: Record<string, unknown>
}

/**
 * Record a single API call.
 * Returns the persisted log entry (use for DB insert later).
 */
export function logUsage(params: LogUsageParams): ApiUsageLog {
  const inputCost  = params.input_units  * getRate(params.provider, params.service, 'input')
  const outputCost = params.output_units * getRate(params.provider, params.service, 'output')

  const entry: ApiUsageLog = {
    id:             `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    provider:       params.provider,
    service:        params.service,
    feature:        params.feature,
    input_units:    params.input_units,
    output_units:   params.output_units,
    estimated_cost: parseFloat((inputCost + outputCost).toFixed(6)),
    status:         params.status ?? 'success',
    created_at:     new Date().toISOString(),
    metadata:       params.metadata,
  }

  pushLog(entry)

  // Fire-and-forget Supabase persist
  supabaseAdmin.from('api_usage_logs').insert({
    id:             entry.id,
    provider:       entry.provider,
    service:        entry.service,
    feature:        entry.feature,
    input_units:    entry.input_units,
    output_units:   entry.output_units,
    estimated_cost: entry.estimated_cost,
    status:         entry.status,
    created_at:     entry.created_at,
    metadata:       entry.metadata ?? null,
  }).then(({ error }) => {
    if (error) console.error('[cost-tracker] Supabase insert failed:', error.message)
  })

  return entry
}

// ─── Async helper (explicit callers) ─────────────────────────────────────────

export async function logApiUsage({
  provider,
  service,
  model,
  feature,
  inputUnits,
  outputUnits,
  cost,
}: {
  provider: string
  service: string
  model?: string
  feature: string
  inputUnits?: number
  outputUnits?: number
  cost?: number
}) {
  await supabaseAdmin.from('api_usage_logs').insert({
    provider,
    service,
    model:          model ?? null,
    feature,
    input_units:    inputUnits  ?? 0,
    output_units:   outputUnits ?? 0,
    estimated_cost: cost        ?? 0,
  })
}

// ─── Query helpers ────────────────────────────────────────────────────────────

function startOf(unit: 'day' | 'month'): Date {
  const d = new Date()
  if (unit === 'day') {
    d.setHours(0, 0, 0, 0)
  } else {
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
  }
  return d
}

export function getLogsToday():    ApiUsageLog[] {
  const cutoff = startOf('day')
  return logBuffer.filter((l) => new Date(l.created_at) >= cutoff)
}

export function getLogsThisMonth(): ApiUsageLog[] {
  const cutoff = startOf('month')
  return logBuffer.filter((l) => new Date(l.created_at) >= cutoff)
}

export function getSpendToday():    number {
  return getLogsToday().reduce((s, l) => s + l.estimated_cost, 0)
}

export function getSpendThisMonth(): number {
  return getLogsThisMonth().reduce((s, l) => s + l.estimated_cost, 0)
}

export function getAiCallsToday(): number {
  return getLogsToday().filter((l) =>
    ['anthropic', 'openai'].includes(l.provider),
  ).length
}

/** Most recent N log entries across all time */
export function getRecentLogs(limit = 50): ApiUsageLog[] {
  return logBuffer.slice(0, limit)
}

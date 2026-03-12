/**
 * lib/discovery/scoring.ts
 *
 * Opportunity scoring for discovered leads.
 *
 * Score range: 0 – 100
 *
 * Logic:
 *  - High review count → established business with real customers (worth targeting)
 *  - Rating 3.5–4.4 → good but not dominant; room to grow (best outreach window)
 *  - Rating 4.5+     → dominant player; harder sell
 *  - No website      → highest-value signal — they clearly need help
 *  - No phone        → slight penalty (harder to reach)
 *  - Has email       → bonus (direct outreach possible)
 */

import type { NormalizedCompanyLead } from './types'

// ─── Score breakdown shape ────────────────────────────────────────────────────

export interface ScoreBreakdown {
  /** Final score 0–100 */
  total: number
  /** One line per scoring rule that fired */
  reasons: string[]
  /** Priority tier derived from score */
  tier: 'hot' | 'warm' | 'cold'
}

// ─── Tier thresholds ─────────────────────────────────────────────────────────

const TIER_HOT  = 70
const TIER_WARM = 40

// ─── Core scorer ─────────────────────────────────────────────────────────────

export function scoreCompany(
  company: Pick<
    NormalizedCompanyLead,
    'website' | 'phone' | 'email' | 'rating' | 'reviewCount'
  >,
): ScoreBreakdown {
  let score   = 0
  const reasons: string[] = []

  // ── Review count (max 40 pts) ─────────────────────────────────────────────
  const reviews = company.reviewCount ?? 0

  if (reviews >= 200) {
    score += 40
    reasons.push(`${reviews} reviews — highly established (+40)`)
  } else if (reviews >= 100) {
    score += 30
    reasons.push(`${reviews} reviews — well established (+30)`)
  } else if (reviews >= 50) {
    score += 20
    reasons.push(`${reviews} reviews — growing business (+20)`)
  } else if (reviews >= 10) {
    score += 10
    reasons.push(`${reviews} reviews — early stage (+10)`)
  }

  // ── Rating sweet spot (max 20 pts) ───────────────────────────────────────
  // 3.5–4.4: good but not dominant → best outreach window
  // 4.5+: dominant player, harder to displace
  // <3.5: reputation issues, skip
  const rating = company.rating

  if (rating !== undefined && rating !== null) {
    if (rating >= 3.5 && rating < 4.5) {
      score += 20
      reasons.push(`Rating ${rating} — competitive sweet spot (+20)`)
    } else if (rating >= 4.5) {
      score += 10
      reasons.push(`Rating ${rating} — dominant player (+10)`)
    } else if (rating >= 3.0) {
      score += 5
      reasons.push(`Rating ${rating} — below average, could use help (+5)`)
    }
  }

  // ── Website (max 30 pts) ──────────────────────────────────────────────────
  if (!company.website) {
    score += 30
    reasons.push('No website detected — high-value digital gap (+30)')
  }

  // ── Phone (max 5 pts / –5 penalty) ───────────────────────────────────────
  if (company.phone) {
    score += 5
    reasons.push('Phone number listed — reachable (+5)')
  } else {
    score -= 5
    reasons.push('No phone number — harder to reach (−5)')
  }

  // ── Email (max 5 pts) ─────────────────────────────────────────────────────
  if (company.email) {
    score += 5
    reasons.push('Email address available — direct outreach possible (+5)')
  }

  // ── Clamp to 0–100 ────────────────────────────────────────────────────────
  const total = Math.max(0, Math.min(100, score))

  const tier: ScoreBreakdown['tier'] =
    total >= TIER_HOT  ? 'hot'  :
    total >= TIER_WARM ? 'warm' :
    'cold'

  return { total, reasons, tier }
}

// ─── Batch scorer ─────────────────────────────────────────────────────────────

export interface ScoredLead<T> {
  lead: T
  score: ScoreBreakdown
}

/**
 * Score an array of leads and return them sorted by score descending.
 * Generic so it works with NormalizedCompanyLead or any superset.
 */
export function rankLeads<T extends Pick<
  NormalizedCompanyLead,
  'website' | 'phone' | 'email' | 'rating' | 'reviewCount'
>>(leads: T[]): ScoredLead<T>[] {
  return leads
    .map((lead) => ({ lead, score: scoreCompany(lead) }))
    .sort((a, b) => b.score.total - a.score.total)
}

// ─── Convenience filter ───────────────────────────────────────────────────────

/** Return only leads that meet a minimum score threshold. */
export function filterByScore<T extends Pick<
  NormalizedCompanyLead,
  'website' | 'phone' | 'email' | 'rating' | 'reviewCount'
>>(leads: T[], minScore = TIER_WARM): T[] {
  return leads.filter((lead) => scoreCompany(lead).total >= minScore)
}

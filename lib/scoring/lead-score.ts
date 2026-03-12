/**
 * Deterministic lead scoring engine.
 *
 * Scores are computed using simple rules derived from the company record and,
 * optionally, the AI analysis result. Each dimension is scored independently
 * and summed to produce a total score.
 *
 * Tiers:
 *  ≥ 80   → hot
 *  55–79  → warm
 *  < 55   → cold
 */

import type {
  CompanyRecord,
  CompanyAnalysisResult,
  LeadScoreBreakdown,
  LeadTier,
} from '@/lib/types/lead-intelligence'

// ─── Tier Classifier ──────────────────────────────────────────────────────────

function classifyTier(total: number): LeadTier {
  if (total >= 80) return 'hot'
  if (total >= 55) return 'warm'
  return 'cold'
}

// ─── Fit Score ────────────────────────────────────────────────────────────────
// Measures how well the company matches the ideal customer profile.

function computeFitScore(company: CompanyRecord): number {
  let score = 0

  // Firmographic completeness
  if (company.industry)  score += 10
  if (company.city)      score += 5
  if (company.website)   score += 10

  // Employee count bands (mutually exclusive — only the best match applies)
  const emp = company.employee_count ?? 0
  if (emp >= 2 && emp <= 10) {
    score += 10
  } else if (emp >= 11 && emp <= 50) {
    score += 20          // Sweet spot — small team, likely decision-maker reachable
  } else if (emp >= 51 && emp <= 200) {
    score += 10
  }

  return score
}

// ─── Pain Score ───────────────────────────────────────────────────────────────
// Measures how strong the company's inferred pain is — higher pain = more urgent.
// Uses stored analysis_summary + live analysis painPoints for keyword signals.

function computePainScore(
  company: CompanyRecord,
  analysis?: CompanyAnalysisResult,
): number {
  let score = 0

  // No website at all is the strongest pain signal
  if (!company.website) {
    score += 25
    return score  // remaining checks require a website
  }

  // Aggregate all text we have from the analysis for keyword scanning
  const analysisText = [
    company.analysis_summary ?? '',
    analysis?.summary ?? '',
    ...(analysis?.painPoints ?? []),
  ]
    .join(' ')
    .toLowerCase()

  // Outdated design
  if (
    analysisText.includes('outdated') ||
    analysisText.includes('old design') ||
    analysisText.includes('dated design') ||
    analysisText.includes('needs redesign')
  ) {
    score += 15
  }

  // No clear CTA
  if (
    analysisText.includes('no cta') ||
    analysisText.includes('no clear cta') ||
    analysisText.includes('missing cta') ||
    analysisText.includes('call to action') ||
    analysisText.includes('no call-to-action')
  ) {
    score += 15
  }

  // Performance / mobile issues
  if (
    analysisText.includes('slow') ||
    analysisText.includes('mobile') ||
    analysisText.includes('loading time') ||
    analysisText.includes('page speed') ||
    analysisText.includes('not mobile')
  ) {
    score += 10
  }

  // Manual follow-up / no automation
  if (
    analysisText.includes('manual') ||
    analysisText.includes('no automation') ||
    analysisText.includes('follow-up') ||
    analysisText.includes('follow up') ||
    analysisText.includes('no system') ||
    analysisText.includes('poor follow')
  ) {
    score += 20
  }

  return score
}

// ─── Reachability Score ───────────────────────────────────────────────────────
// Measures how easy it is to actually reach someone at this company.

function computeReachabilityScore(company: CompanyRecord): number {
  let score = 0

  if (company.phone)        score += 10
  if (company.linkedin_url) score += 10
  if (company.website)      score += 10

  return score
}

// ─── Timing Score ─────────────────────────────────────────────────────────────
// Uses the AI-inferred urgency level.

function computeTimingScore(analysis?: CompanyAnalysisResult): number {
  if (!analysis) return 0

  switch (analysis.urgencyLevel) {
    case 'high':   return 20
    case 'medium': return 10
    case 'low':
    default:       return 0
  }
}

// ─── Main Function ─────────────────────────────────────────────────────────────

/**
 * Compute a full lead score breakdown for a company.
 *
 * @param company  - The company record from the database
 * @param analysis - Optional AI analysis (improves pain + timing scores)
 */
export function computeLeadScore(
  company: CompanyRecord,
  analysis?: CompanyAnalysisResult,
): LeadScoreBreakdown {
  const fitScore          = computeFitScore(company)
  const painScore         = computePainScore(company, analysis)
  const reachabilityScore = computeReachabilityScore(company)
  const timingScore       = computeTimingScore(analysis)
  const totalScore        = fitScore + painScore + reachabilityScore + timingScore
  const tier              = classifyTier(totalScore)

  return {
    fitScore,
    painScore,
    reachabilityScore,
    timingScore,
    totalScore,
    tier,
  }
}

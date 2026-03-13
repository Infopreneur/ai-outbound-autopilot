export type CompanyForScoring = {
  name: string
  niche?: string | null
  website?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  rating?: number | null
  review_count?: number | null
}

// ── Offer IDs ────────────────────────────────────────────────────────────────
export type OfferId =
  | 'followup-automation'
  | 'database-reactivation'
  | 'positioning-report'

export type OfferRecommendation = {
  offerId: OfferId
  offerName: string
  fitScore: number        // 0–100
  reason: string
  headline: string        // short pitch line
  primarySignal: string   // the single data point that triggered this
}

export type OpportunityScoreResult = {
  leadVolumeScore: number
  followupGapScore: number
  localVisibilityScore: number
  offerFitScore: number
  totalScore: number
  tier: 'hot' | 'warm' | 'cold'
  reason: string
  recommendedOffer: string
  recommendedNextStep: string
  // ── New: ranked offer recommendations ──────────────────────────────────────
  offerRecommendations: OfferRecommendation[]
  topOffer: OfferId
}

// ── Niche groups ─────────────────────────────────────────────────────────────
const HIGH_PRIORITY_NICHES = new Set([
  'roofing', 'solar', 'med spa', 'medspa', 'hvac',
])

function nicheIncludes(niche: string, ...terms: string[]): boolean {
  return terms.some((t) => niche.includes(t))
}

// ── Offer scoring helpers ─────────────────────────────────────────────────────

/**
 * 24/7 Follow-Up Automation
 * Best for: active businesses with lots of leads but no follow-up system.
 * Signals: high review count (busy), missing/weak website, rating 3.5–4.3
 *          (getting leads but not converting), phone present (takes calls).
 */
function scoreFollowupAutomation(c: CompanyForScoring): OfferRecommendation {
  const reviews = c.review_count ?? 0
  const rating  = c.rating ?? 0
  let score = 0
  const signals: string[] = []

  // High review count = active lead flow
  if (reviews >= 500)      { score += 35; signals.push(`${reviews} reviews = strong lead volume`) }
  else if (reviews >= 200) { score += 28; signals.push(`${reviews} reviews = solid lead flow`) }
  else if (reviews >= 75)  { score += 18; signals.push(`${reviews} reviews = moderate lead flow`) }
  else if (reviews >= 25)  { score += 8 }

  // Mid rating = getting leads but not converting well (follow-up gap)
  if (rating >= 3.5 && rating <= 4.3) { score += 25; signals.push(`${rating}★ rating suggests conversion gap`) }
  else if (rating > 4.3)              { score += 10 }

  // Missing website = no automation in place
  if (!c.website) { score += 20; signals.push('no website = no follow-up system') }

  // Phone present = they take inbound calls (good fit for missed call automation)
  if (c.phone) { score += 10; signals.push('phone listed = inbound call flow exists') }

  // Niche bonus
  const niche = (c.niche ?? '').toLowerCase()
  if (nicheIncludes(niche, 'roof', 'hvac', 'air condition', 'plumb', 'electr', 'pest')) score += 10
  else if (nicheIncludes(niche, 'solar', 'med spa', 'medspa', 'aesthetic', 'dental', 'legal')) score += 8

  score = Math.min(score, 100)

  return {
    offerId:       'followup-automation',
    offerName:     '24/7 Automated Follow-Up',
    fitScore:      score,
    reason:        signals[0] ?? 'active business with lead flow signals',
    headline:      `Never miss a ${c.niche ?? 'lead'} inquiry again — close 20–30% more deals`,
    primarySignal: signals[0] ?? `${reviews} reviews`,
  }
}

/**
 * Database Reactivation
 * Best for: established businesses with a large existing customer base
 *           who have stopped marketing to it.
 * Signals: high review count (large past-customer database), good rating
 *          (customers liked them, just haven't heard from them), website exists
 *          (they're somewhat digital but not activating their list).
 */
function scoreDatabaseReactivation(c: CompanyForScoring): OfferRecommendation {
  const reviews = c.review_count ?? 0
  const rating  = c.rating ?? 0
  let score = 0
  const signals: string[] = []

  // Large review count = large customer base (proxy for database size)
  if (reviews >= 1000)     { score += 40; signals.push(`${reviews} reviews = large existing customer database`) }
  else if (reviews >= 400) { score += 32; signals.push(`${reviews} reviews = substantial customer database`) }
  else if (reviews >= 150) { score += 20; signals.push(`${reviews} reviews = reactivatable customer base`) }
  else if (reviews >= 50)  { score += 10 }

  // Good rating = customers liked them (reactivation will work)
  if (rating >= 4.4)      { score += 25; signals.push(`${rating}★ — customers love them, just haven't been contacted`) }
  else if (rating >= 4.0) { score += 18 }
  else if (rating >= 3.5) { score += 8 }

  // Has website = some digital infrastructure already
  if (c.website) { score += 15; signals.push('has website = some digital presence to leverage') }

  // Niche bonus — service businesses with repeat-customer potential
  const niche = (c.niche ?? '').toLowerCase()
  if (nicheIncludes(niche, 'dental', 'med spa', 'medspa', 'aesthetic', 'chiro', 'salon', 'spa')) {
    score += 20; signals.push('recurring-service niche = high reactivation ROI')
  } else if (nicheIncludes(niche, 'hvac', 'roof', 'plumb', 'electr', 'pest')) {
    score += 12
  } else if (nicheIncludes(niche, 'solar', 'legal', 'insurance')) {
    score += 8
  }

  score = Math.min(score, 100)

  return {
    offerId:       'database-reactivation',
    offerName:     'Database Reactivation System',
    fitScore:      score,
    reason:        signals[0] ?? 'established business with reactivatable customer base',
    headline:      `Extract the revenue hidden in ${c.name}'s existing customer database`,
    primarySignal: signals[0] ?? `${reviews} reviews`,
  }
}

/**
 * Custom Online Positioning Report
 * Best for: businesses with weak online presence — low reviews, poor rating,
 *           no website — where the gap IS the opportunity.
 * Signals: low review count, rating below 4.0, missing website, missing phone.
 */
function scorePositioningReport(c: CompanyForScoring): OfferRecommendation {
  const reviews = c.review_count ?? 0
  const rating  = c.rating ?? 0
  let score = 0
  const signals: string[] = []

  // Low review count = visibility problem
  if (reviews < 20)       { score += 35; signals.push(`only ${reviews} reviews = severe visibility gap`) }
  else if (reviews < 50)  { score += 28; signals.push(`${reviews} reviews = below-average visibility`) }
  else if (reviews < 100) { score += 18; signals.push(`${reviews} reviews = room to grow`) }
  else                    { score += 5 }

  // Poor/no rating = reputation opportunity
  if (rating === 0)                  { score += 25; signals.push('no rating = no online reputation yet') }
  else if (rating < 3.5)            { score += 30; signals.push(`${rating}★ rating = urgent reputation problem`) }
  else if (rating >= 3.5 && rating < 4.2) { score += 18; signals.push(`${rating}★ — below competitor average`) }

  // Missing website = no positioning at all
  if (!c.website) { score += 20; signals.push('no website = invisible to online searchers') }

  // Missing phone = incomplete profile
  if (!c.phone)   { score += 10; signals.push('no phone listed = incomplete business profile') }

  // Niche — any local service business can benefit
  const niche = (c.niche ?? '').toLowerCase()
  if (niche) { score += 10 }

  score = Math.min(score, 100)

  return {
    offerId:       'positioning-report',
    offerName:     'Custom Online Positioning Report',
    fitScore:      score,
    reason:        signals[0] ?? 'business with online presence gaps',
    headline:      `See exactly why ${c.name} is losing customers to competitors online`,
    primarySignal: signals[0] ?? 'online presence gaps detected',
  }
}

// ── Main scoring function ─────────────────────────────────────────────────────

export function scoreOpportunity(company: CompanyForScoring): OpportunityScoreResult {
  let leadVolumeScore    = 0
  let followupGapScore   = 0
  let localVisibilityScore = 0
  let offerFitScore      = 0

  const reviews = company.review_count ?? 0
  const rating  = company.rating ?? 0
  const niche   = (company.niche ?? '').toLowerCase()

  // Lead volume score
  if (reviews >= 1000)     leadVolumeScore += 40
  else if (reviews >= 300) leadVolumeScore += 30
  else if (reviews >= 100) leadVolumeScore += 20
  else if (reviews >= 30)  leadVolumeScore += 10

  // Follow-up gap score
  if (!company.website)                          followupGapScore += 25
  if (!company.phone)                            followupGapScore += 10
  if (reviews >= 100 && !company.website)        followupGapScore += 20
  if (rating > 0 && rating < 4.4)               followupGapScore += 10

  // Local visibility score
  if (rating >= 4.7)       localVisibilityScore += 15
  else if (rating >= 4.4)  localVisibilityScore += 10
  if (reviews >= 100)      localVisibilityScore += 15
  else if (reviews >= 30)  localVisibilityScore += 10
  if (company.phone)       localVisibilityScore += 10
  if (company.city && company.state) localVisibilityScore += 5

  // Offer fit score (niche premium)
  if (niche.includes('roof'))                                                         offerFitScore += 25
  else if (niche.includes('solar'))                                                   offerFitScore += 25
  else if (nicheIncludes(niche, 'med spa', 'medspa', 'aesthetic'))                   offerFitScore += 25
  else if (nicheIncludes(niche, 'hvac', 'air condition'))                            offerFitScore += 20
  else if (HIGH_PRIORITY_NICHES.has(niche))                                          offerFitScore += 20
  else                                                                                offerFitScore += 5

  const totalScore = leadVolumeScore + followupGapScore + localVisibilityScore + offerFitScore

  let tier: 'hot' | 'warm' | 'cold' = 'cold'
  if (totalScore >= 75) tier = 'hot'
  else if (totalScore >= 45) tier = 'warm'

  const reasons: string[] = []
  if (reviews >= 300)    reasons.push('high review volume suggests strong lead flow')
  if (!company.website)  reasons.push('missing website suggests process gaps')
  if (company.phone)     reasons.push('direct contact path available')
  if (offerFitScore >= 20) reasons.push('strong fit for AI follow-up automation')

  // ── Score all 3 offers ────────────────────────────────────────────────────
  const offerScores = [
    scoreFollowupAutomation(company),
    scoreDatabaseReactivation(company),
    scorePositioningReport(company),
  ].sort((a, b) => b.fitScore - a.fitScore)

  const topOffer = offerScores[0].offerId

  // Legacy single-offer recommendation (keep for backwards compat)
  const recommendedOffer =
    niche.includes('roof')
      ? 'AI follow-up for estimate requests and missed inbound leads'
      : niche.includes('solar')
      ? 'AI qualification and follow-up for high-value solar inquiries'
      : nicheIncludes(niche, 'med spa', 'medspa', 'aesthetic')
      ? 'AI booking follow-up and database reactivation for consultations'
      : 'AI follow-up automation and database reactivation'

  const recommendedNextStep =
    tier === 'hot'
      ? 'Generate outreach + personalized demo immediately'
      : tier === 'warm'
      ? 'Queue for enrichment and website scan'
      : 'Keep in nurture queue until more signals are available'

  return {
    leadVolumeScore,
    followupGapScore,
    localVisibilityScore,
    offerFitScore,
    totalScore,
    tier,
    reason: reasons.join('; ') || 'basic local business fit',
    recommendedOffer,
    recommendedNextStep,
    offerRecommendations: offerScores,
    topOffer,
  }
}

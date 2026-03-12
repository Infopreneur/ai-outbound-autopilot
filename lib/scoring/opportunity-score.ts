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
}

const HIGH_PRIORITY_NICHES = new Set([
  'roofing',
  'solar',
  'med spa',
  'medspa',
  'hvac',
])

export function scoreOpportunity(company: CompanyForScoring): OpportunityScoreResult {
  let leadVolumeScore = 0
  let followupGapScore = 0
  let localVisibilityScore = 0
  let offerFitScore = 0

  const reviews = company.review_count ?? 0
  const rating = company.rating ?? 0
  const niche = (company.niche ?? '').toLowerCase()

  // Lead volume score
  if (reviews >= 1000) leadVolumeScore += 40
  else if (reviews >= 300) leadVolumeScore += 30
  else if (reviews >= 100) leadVolumeScore += 20
  else if (reviews >= 30) leadVolumeScore += 10

  // Follow-up gap score
  if (!company.website) followupGapScore += 25
  if (!company.phone) followupGapScore += 10
  if (reviews >= 100 && !company.website) followupGapScore += 20
  if (rating > 0 && rating < 4.4) followupGapScore += 10

  // Local visibility score
  if (rating >= 4.7) localVisibilityScore += 15
  else if (rating >= 4.4) localVisibilityScore += 10

  if (reviews >= 100) localVisibilityScore += 15
  else if (reviews >= 30) localVisibilityScore += 10

  if (company.phone) localVisibilityScore += 10
  if (company.city && company.state) localVisibilityScore += 5

  // Offer fit score
  if (niche.includes('roof')) offerFitScore += 25
  else if (niche.includes('solar')) offerFitScore += 25
  else if (niche.includes('med spa') || niche.includes('medspa') || niche.includes('aesthetic')) offerFitScore += 25
  else if (niche.includes('hvac') || niche.includes('air conditioning')) offerFitScore += 20
  else if (HIGH_PRIORITY_NICHES.has(niche)) offerFitScore += 20
  else offerFitScore += 5

  const totalScore =
    leadVolumeScore +
    followupGapScore +
    localVisibilityScore +
    offerFitScore

  let tier: 'hot' | 'warm' | 'cold' = 'cold'
  if (totalScore >= 75) tier = 'hot'
  else if (totalScore >= 45) tier = 'warm'

  const reasons: string[] = []
  if (reviews >= 300) reasons.push('high review volume suggests strong lead flow')
  if (!company.website) reasons.push('missing website suggests process gaps')
  if (company.phone) reasons.push('direct contact path available')
  if (offerFitScore >= 20) reasons.push('strong fit for AI follow-up automation')

  const recommendedOffer =
    niche.includes('roof')
      ? 'AI follow-up for estimate requests and missed inbound leads'
      : niche.includes('solar')
      ? 'AI qualification and follow-up for high-value solar inquiries'
      : niche.includes('med spa') || niche.includes('medspa') || niche.includes('aesthetic')
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
  }
}

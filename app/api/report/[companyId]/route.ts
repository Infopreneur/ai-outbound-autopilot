/**
 * GET /api/report/[companyId]
 *
 * Generates (or returns cached) an Online Positioning Report for a company.
 * Uses real data from the companies table + Claude AI for the action plan.
 * Results are cached in reputation_reports table keyed by company_id.
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAIClient }   from '@/lib/ai/client'
import { logUsage }      from '@/lib/usage/cost-tracker'

// ── Revenue loss estimate ─────────────────────────────────────────────────────
// Industry data: 28% more revenue for businesses 4.0–4.5★ vs < 3.5★
// We estimate monthly leads from review velocity (review_count / assumed business age)
function estimateLostRevenue(rating: number | null, reviewCount: number | null, niche: string | null): number {
  if (!rating || !reviewCount) return 0

  // Avg revenue per deal by niche (rough estimates)
  const avgDeal: Record<string, number> = {
    roofing: 12000, solar: 25000, hvac: 3500, 'med spa': 800, medspa: 800,
    dental: 1200, plumbing: 600, electrical: 900, pest: 400, 'default': 2000,
  }
  const nicheKey = (niche ?? '').toLowerCase()
  const dealVal  = Object.entries(avgDeal).find(([k]) => nicheKey.includes(k))?.[1] ?? avgDeal.default

  // Estimated monthly leads = review_count / 24 (assume 2yr business)
  const monthlyLeads = Math.max(1, Math.round(reviewCount / 24))

  // Revenue gap: if rating < 4.2, assume 15% conversion loss
  if (rating >= 4.2) return 0
  const conversionLoss = rating < 3.5 ? 0.28 : 0.15
  return Math.round(monthlyLeads * conversionLoss * dealVal)
}

// ── Reputation score (0–100) ──────────────────────────────────────────────────
function calcReputationScore(
  rating: number | null,
  reviewCount: number | null,
  website: string | null,
  phone: string | null,
): { score: number; breakdown: Record<string, number> } {
  let score = 0
  const breakdown: Record<string, number> = {}

  // Rating (max 40 pts)
  if (rating !== null) {
    const ratingPts = Math.round((rating / 5) * 40)
    breakdown.rating = ratingPts
    score += ratingPts
  }

  // Review volume (max 30 pts)
  const reviews = reviewCount ?? 0
  const reviewPts =
    reviews >= 500 ? 30 : reviews >= 200 ? 24 : reviews >= 100 ? 18 :
    reviews >= 50  ? 12 : reviews >= 20  ?  6 : reviews > 0  ?  2 : 0
  breakdown.reviews = reviewPts
  score += reviewPts

  // Digital presence (max 20 pts)
  const presencePts = (website ? 12 : 0) + (phone ? 8 : 0)
  breakdown.presence = presencePts
  score += presencePts

  // Completeness bonus (max 10 pts)
  const completePts = (rating ? 5 : 0) + (reviews >= 20 ? 5 : 0)
  breakdown.completeness = completePts
  score += completePts

  return { score: Math.min(score, 100), breakdown }
}

// ── AI action plan ────────────────────────────────────────────────────────────
async function generateActionPlan(company: {
  name: string; niche: string | null; city: string | null;
  rating: number | null; review_count: number | null;
  website: string | null; phone: string | null;
  reputationScore: number;
}): Promise<string[]> {
  const prompt = `You are an online reputation and local SEO expert.

BUSINESS DATA:
- Name: ${company.name}
- Niche: ${company.niche ?? 'Local service business'}
- City: ${company.city ?? 'Unknown'}
- Google Rating: ${company.rating ?? 'None'}
- Total Reviews: ${company.review_count ?? 0}
- Website: ${company.website ? 'Yes' : 'No'}
- Phone Listed: ${company.phone ? 'Yes' : 'No'}
- Reputation Score: ${company.reputationScore}/100

Provide exactly 5 specific, actionable recommendations to improve this business's online reputation and local visibility. Each recommendation must be tailored to their specific situation.

Return ONLY a valid JSON array of 5 strings. No markdown, no explanation.
Example format: ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4", "Recommendation 5"]`

  try {
    const raw     = await getAIClient().complete(prompt)
    const parsed  = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.slice(0, 5).map(String)
  } catch {
    // fallback
  }

  return [
    `Increase review count from ${company.review_count ?? 0} — target 50+ to rank in local Google pack`,
    company.rating && company.rating < 4.0
      ? `Actively respond to negative reviews to improve ${company.rating}★ rating`
      : 'Maintain rating by responding to all reviews within 24 hours',
    !company.website ? 'Build a website — businesses with websites get 35% more calls' : 'Optimize website for local SEO keywords',
    `Run a Google Business Profile audit — ensure hours, photos, and services are complete`,
    `Implement a review request system to accelerate review velocity`,
  ]
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params
  const { searchParams } = new URL(req.url)
  const refresh          = searchParams.get('refresh') === 'true'

  // Fetch company
  const { data: company, error: compErr } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (compErr || !company)
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 })

  // Check cache (unless refresh requested)
  if (!refresh) {
    const { data: cached } = await supabaseAdmin
      .from('reputation_reports')
      .select('*')
      .eq('company_id', companyId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) return NextResponse.json(cached)
  }

  // Compute scores
  const { score: reputationScore, breakdown } = calcReputationScore(
    company.rating, company.review_count, company.website, company.phone,
  )
  const lostRevenue = estimateLostRevenue(company.rating, company.review_count, company.niche)

  // Review velocity (reviews per month, assuming 2yr avg business age)
  const reviewVelocity = company.review_count
    ? parseFloat((company.review_count / 24).toFixed(1))
    : 0

  // Visibility score — based on review count vs local average
  const avgLocalReviews = 85  // rough benchmark for local service businesses
  const visibilityScore = Math.min(100,
    Math.round(((company.review_count ?? 0) / avgLocalReviews) * 100),
  )

  // AI action plan
  const aiActionPlan = await generateActionPlan({
    name:            company.name,
    niche:           company.niche,
    city:            company.city,
    rating:          company.rating,
    review_count:    company.review_count,
    website:         company.website,
    phone:           company.phone,
    reputationScore,
  })

  logUsage({
    provider: 'anthropic', service: 'claude-sonnet-4-6', feature: 'positioning-report',
    input_units: 0, output_units: 0, status: 'success',
    metadata: { companyId: companyId },
  })

  // Build full report
  const report = {
    company_id:           companyId,
    company_name:         company.name,
    company_niche:        company.niche,
    company_city:         company.city,
    company_state:        company.state,
    company_rating:       company.rating,
    company_reviews:      company.review_count,
    company_website:      company.website,
    company_phone:        company.phone,
    overall_score:        reputationScore,
    visibility_score:     visibilityScore,
    review_velocity:      reviewVelocity,
    lost_revenue_estimate: lostRevenue,
    score_breakdown:      breakdown,
    ai_action_plan:       aiActionPlan,
    generated_at:         new Date().toISOString(),
  }

  // Cache in Supabase (best-effort)
  await supabaseAdmin
    .from('reputation_reports')
    .upsert(report, { onConflict: 'company_id' })
    .then(({ error: e }) => {
      if (e) console.warn('[report] cache upsert skipped (table may not exist yet):', e.message)
    })

  return NextResponse.json(report)
}

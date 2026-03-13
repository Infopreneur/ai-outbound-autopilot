import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { scoreOpportunity } from '@/lib/scoring/opportunity-score'

export async function POST() {
  const { data: companies, error } = await supabaseAdmin
    .from('companies')
    .select('id, name, niche, website, phone, city, state, rating, review_count')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const updates =
    (companies ?? []).map((company) => {
      const score = scoreOpportunity(company)

      const now = new Date().toISOString()
      return {
        id: company.id,
        lead_volume_score:      score.leadVolumeScore,
        followup_gap_score:     score.followupGapScore,
        local_visibility_score: score.localVisibilityScore,
        offer_fit_score:        score.offerFitScore,
        opportunity_score:      score.totalScore,
        opportunity_tier:       score.tier,
        opportunity_reason:     score.reason,
        recommended_offer:      score.recommendedOffer,
        recommended_next_step:  score.recommendedNextStep,
        top_offer:              score.topOffer,
        offer_fit_breakdown:    score.offerRecommendations,
        last_scored_at:         now,
      }
    })

  for (const row of updates) {
    const { error: updateError } = await supabaseAdmin
      .from('companies')
      .update({
        lead_volume_score:      row.lead_volume_score,
        followup_gap_score:     row.followup_gap_score,
        local_visibility_score: row.local_visibility_score,
        offer_fit_score:        row.offer_fit_score,
        opportunity_score:      row.opportunity_score,
        opportunity_tier:       row.opportunity_tier,
        opportunity_reason:     row.opportunity_reason,
        recommended_offer:      row.recommended_offer,
        recommended_next_step:  row.recommended_next_step,
        top_offer:              row.top_offer,
        offer_fit_breakdown:    row.offer_fit_breakdown,
        last_scored_at:         row.last_scored_at,
      })
      .eq('id', row.id)

    if (updateError) {
      console.error('Score update failed for company', row.id, updateError.message)
    }
  }

  return NextResponse.json({
    success: true,
    scored: updates.length,
  })
}

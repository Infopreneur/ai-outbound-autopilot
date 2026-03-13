import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    // KPI: total leads (companies count)
    const { count: totalLeads } = await supabaseAdmin
      .from('companies')
      .select('id', { head: true, count: 'exact' })

    // Recent prospects: latest 5 companies
    const { data: recentProspects, error: recentError } = await supabaseAdmin
      .from('companies')
      .select('id,name,opportunity_score,opportunity_tier,city,state,created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      throw recentError
    }

    // Activity feed: last 10 outreach messages
    const { data: activityData, error: activityError } = await supabaseAdmin
      .from('outreach_messages')
      .select('id,company_id,offer,status,created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) {
      throw activityError
    }

    // Outreach stats: emails sent in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: emailsSent } = await supabaseAdmin
      .from('outreach_messages')
      .select('id', { head: true, count: 'exact' })
      .gte('created_at', thirtyDaysAgo)

    // active campaigns count
    const { count: activeCampaignsCount } = await supabaseAdmin
      .from('campaigns')
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'active')

    const { data: deals, error: dealsError } = await supabaseAdmin
      .from('deals')
      .select('value, stage')

    if (dealsError) {
      throw dealsError
    }

    const pipelineValue = (deals ?? []).reduce((sum, deal) => {
      if (deal.stage === 'closed_won' || deal.stage === 'closed_lost') return sum
      const value = typeof deal.value === 'number' ? deal.value : Number(deal.value ?? 0)
      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)

    return NextResponse.json({
      kpis: {
        totalLeads: totalLeads ?? 0,
        meetingsBooked: 0,
        activeCampaigns: activeCampaignsCount ?? 0,
        pipelineValue,
      },
      recentProspects: recentProspects ?? [],
      activity: activityData ?? [],
      outreachStats: {
        emailsSent: emailsSent ?? 0,
      },
    })
  } catch (err: unknown) {
    console.error('dashboard summary error', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'

function isMissingRelationError(message: string) {
  return message.includes('does not exist') || message.includes('Could not find the table')
}

export async function GET() {
  try {
    const ctx = await getAccountContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const supabase = getUserSupabaseClient(ctx.accessToken)

    // KPI: total leads (companies count)
    const { count: totalLeads } = await supabase
      .from('companies')
      .select('id', { head: true, count: 'exact' })
      .eq('account_id', ctx.accountId)

    // Recent prospects: latest 5 companies
    const { data: recentProspects, error: recentError } = await supabase
      .from('companies')
      .select('id,name,opportunity_score,opportunity_tier,city,state,created_at')
      .eq('account_id', ctx.accountId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      throw recentError
    }

    // Activity feed: last 10 outreach messages
    const { data: activityData, error: activityError } = await supabase
      .from('outreach_messages')
      .select('id,company_id,offer,status,created_at')
      .eq('account_id', ctx.accountId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) {
      throw activityError
    }

    // Outreach stats: emails sent in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: emailsSent } = await supabase
      .from('outreach_messages')
      .select('id', { head: true, count: 'exact' })
      .eq('account_id', ctx.accountId)
      .gte('created_at', thirtyDaysAgo)

    // active campaigns count
    const { count: activeCampaignsCount, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id', { head: true, count: 'exact' })
      .eq('account_id', ctx.accountId)
      .eq('status', 'active')

    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('value, stage')
      .eq('account_id', ctx.accountId)

    if (campaignsError && !isMissingRelationError(campaignsError.message)) {
      throw campaignsError
    }

    if (dealsError && !isMissingRelationError(dealsError.message)) {
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
        activeCampaigns: campaignsError ? 0 : (activeCampaignsCount ?? 0),
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

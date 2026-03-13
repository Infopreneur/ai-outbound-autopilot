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

    return NextResponse.json({
      kpis: {
        totalLeads: totalLeads ?? 0,
        meetingsBooked: 0,
        activeCampaigns: 0,
        pipelineValue: 0,
      },
      recentProspects: recentProspects ?? [],
      activity: activityData ?? [],
      outreachStats: {
        emailsSent: emailsSent ?? 0,
      },
    })
  } catch (err: any) {
    console.error('dashboard summary error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
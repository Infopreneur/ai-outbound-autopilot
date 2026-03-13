"use client"

import { useEffect, useState } from 'react'
import {
  Users,
  CalendarCheck,
  Megaphone,
  DollarSign,
  Sparkles,
  Bot,
  Mail,
  Phone,
  Calendar,
  Zap,
  ArrowRight,
  Activity,
  Radar,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { KpiCard } from '@/components/kpi-card'
import { LeadTable } from '@/components/lead-table'
import { Button } from '@/components/ui/button'

interface Prospect {
  id: string
  name: string
  opportunity_score: number | null
  opportunity_tier: string | null
  city: string | null
  state: string | null
  created_at: string
}

interface ActivityRecord {
  id: string
  company_id: string
  offer: string
  status: string
  created_at: string
  meta?: string
}

interface DashboardData {
  kpis: {
    totalLeads: number
    meetingsBooked: number
    activeCampaigns: number
    pipelineValue: number
  }
  recentProspects: Prospect[]
  activity: ActivityRecord[]
  outreachStats: {
    emailsSent: number
  }
}

function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.kpis === 'object' &&
    Array.isArray(candidate.recentProspects) &&
    Array.isArray(candidate.activity) &&
    typeof candidate.outreachStats === 'object'
  )
}

const kpiIcons = [
  <Users key="users" className="w-4 h-4" />,
  <CalendarCheck key="cal" className="w-4 h-4" />,
  <Megaphone key="mega" className="w-4 h-4" />,
  <DollarSign key="dollar" className="w-4 h-4" />,
]

const activityIcons: Record<string, React.ReactNode> = {
  ai: <Bot className="w-3.5 h-3.5 text-indigo-400" />,
  email: <Mail className="w-3.5 h-3.5 text-blue-400" />,
  call: <Phone className="w-3.5 h-3.5 text-emerald-400" />,
  meeting: <Calendar className="w-3.5 h-3.5 text-violet-400" />,
  enrichment: <Zap className="w-3.5 h-3.5 text-amber-400" />,
  note: <Activity className="w-3.5 h-3.5 text-slate-400" />,
}

const activityBg: Record<string, string> = {
  ai: 'bg-indigo-500/10 border-indigo-500/20',
  email: 'bg-blue-500/10 border-blue-500/20',
  call: 'bg-emerald-500/10 border-emerald-500/20',
  meeting: 'bg-violet-500/10 border-violet-500/20',
  enrichment: 'bg-amber-500/10 border-amber-500/20',
  note: 'bg-slate-500/10 border-slate-500/20',
}

function Surface({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[24px] border border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-bg-muted)_96%,white_4%)_0%,var(--panel-bg)_100%)] shadow-[0_20px_48px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  )
}

export default function CommandCenterPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((d) => {
        if (isDashboardData(d)) {
          setData(d)
          setError(null)
          return
        }

        const message = typeof d?.error === 'string' ? d.error : 'Failed to load dashboard summary.'
        setData(null)
        setError(message)
      })
      .catch((fetchError) => {
        console.error(fetchError)
        setData(null)
        setError('Failed to load dashboard summary.')
      })
  }, [])

  const kpisArray = data
    ? [
        { title: 'Total Leads', value: data.kpis.totalLeads.toString(), change: 0, changeLabel: 'Prospect pool', color: 'indigo' },
        { title: 'Meetings Booked', value: data.kpis.meetingsBooked.toString(), change: 0, changeLabel: 'Conversion output', color: 'emerald' },
        { title: 'Active Campaigns', value: data.kpis.activeCampaigns.toString(), change: 0, changeLabel: 'Running sequences', color: 'violet' },
        { title: 'Pipeline Value', value: `$${data.kpis.pipelineValue.toLocaleString()}`, change: 0, changeLabel: 'Open revenue', color: 'amber' },
      ]
    : []

  const prospects = data
    ? data.recentProspects.map((company) => ({
        id: company.id,
        name: company.name,
        firstName: '',
        lastName: '',
        title: '',
        company: company.name,
        companyId: company.id,
        industry: '',
        email: '',
        phone: '',
        location: `${company.city ?? ''}${company.city && company.state ? ', ' : ''}${company.state ?? ''}`,
        employees: '',
        revenue: '',
        score: company.opportunity_score || 0,
        status: (company.opportunity_tier as any) || 'cold',
        source: '',
        tags: [],
        lastActivity: new Date(company.created_at).toLocaleDateString(),
        aiInsight: '',
      }))
    : []

  const activityItems = data
    ? data.activity.map((item) => ({
        id: item.id,
        type: 'email' as const,
        title: `${item.offer} ${item.status}`,
        description: 'Sequence activity recorded and ready for rep follow-up.',
        time: new Date(item.created_at).toLocaleString(),
        meta: item.offer,
      }))
    : []

  return (
    <div className="space-y-8 max-w-[1480px]">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <Surface className="relative overflow-hidden px-7 py-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_48%)] pointer-events-none" />
        <div className="absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.10),transparent_70%)] pointer-events-none" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/15 bg-indigo-500/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
              Revenue Command Center
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
              Direct the entire outbound machine from one decisive operating surface.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              Prioritize revenue actions, watch pipeline momentum, and keep prospecting, outreach, and execution aligned like an enterprise GTM team.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[520px]">
            {[
              { label: 'Workspace', value: 'Live', icon: <ShieldCheck className="w-3.5 h-3.5" />, tone: 'text-emerald-500' },
              { label: 'Signals', value: data ? String(data.activity.length) : '0', icon: <Radar className="w-3.5 h-3.5" />, tone: 'text-cyan-500' },
              { label: 'Prospects', value: data ? String(data.recentProspects.length) : '0', icon: <Users className="w-3.5 h-3.5" />, tone: 'text-violet-500' },
              { label: 'Emails', value: data ? String(data.outreachStats.emailsSent) : '0', icon: <Mail className="w-3.5 h-3.5" />, tone: 'text-indigo-500' },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[var(--panel-border)] bg-[color:color-mix(in_srgb,var(--panel-bg)_88%,white_12%)] px-4 py-3.5"
              >
                <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 ${metric.tone}`}>
                  {metric.icon}
                </div>
                <div className={`text-2xl font-semibold ${metric.tone}`}>{metric.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisArray.map((kpi, i) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            icon={kpiIcons[i]}
            color={kpi.color as 'indigo' | 'emerald' | 'violet' | 'amber'}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_0.9fr] gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent Prospects</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Freshly scored accounts ready for rep attention</p>
            </div>
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <LeadTable leads={prospects} compact />
        </div>

        <div className="space-y-5">
          <Surface className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Activity</h3>
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            <div className="space-y-3">
              {activityItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--panel-border)] bg-[var(--panel-bg)] px-4 py-6 text-sm text-[var(--text-muted)]">
                  No automation events yet. Launch a prospecting or outreach action to start the feed.
                </div>
              ) : (
                activityItems.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-4 py-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${activityBg[item.type] ?? activityBg.note}`}>
                      {activityIcons[item.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] leading-snug">{item.title}</div>
                        {item.meta && (
                          <span className="text-[10px] text-[var(--text-subtle)] bg-[var(--panel-bg-muted)] px-1.5 py-0.5 rounded-full border border-[var(--input-border)] whitespace-nowrap">
                            {item.meta}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">{item.description}</div>
                      <div className="text-[10px] text-[var(--text-subtle)] mt-1.5">{item.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Run AI Prospecting', icon: <Sparkles className="w-3.5 h-3.5" />, tone: 'text-indigo-400 bg-indigo-500/10' },
                { label: 'Launch Email Campaign', icon: <Mail className="w-3.5 h-3.5" />, tone: 'text-blue-400 bg-blue-500/10' },
                { label: 'Schedule Demo', icon: <Calendar className="w-3.5 h-3.5" />, tone: 'text-violet-400 bg-violet-500/10' },
                { label: 'Enrich Leads', icon: <Zap className="w-3.5 h-3.5" />, tone: 'text-amber-400 bg-amber-500/10' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[var(--panel-bg)] border border-[var(--input-border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-500/25 hover:bg-[var(--panel-bg-subtle)] transition-all text-left"
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${action.tone}`}>
                    {action.icon}
                  </span>
                  {action.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-[var(--text-subtle)]" />
                </button>
              ))}
            </div>
          </Surface>
        </div>
      </div>

      <Surface className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Outreach Performance</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">30-day operating view across active motions</p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((range, index) => (
              <button
                key={range}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                  index === 1
                    ? 'bg-indigo-600/15 text-indigo-500 border border-indigo-500/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Emails Sent', value: data ? data.outreachStats.emailsSent.toLocaleString() : '-', sub: 'Outbound volume', color: 'text-blue-500' },
            { label: 'Open Rate', value: '-', sub: '+4.1% vs benchmark', color: 'text-indigo-500' },
            { label: 'Reply Rate', value: '-', sub: '+2.3% vs last month', color: 'text-violet-500' },
            { label: 'Demos Booked', value: '0', sub: 'Meeting conversion', color: 'text-emerald-500' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[var(--input-border)] bg-[var(--panel-bg)] p-4">
              <div className={`text-2xl font-semibold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</div>
              <div className="text-xs text-[var(--text-subtle)] mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--input-border)] bg-[var(--panel-bg)] px-4 py-5">
          <div className="flex items-end gap-2 h-24">
            {[42, 65, 55, 78, 62, 88, 74, 91, 68, 82, 76, 95, 71, 84].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-[6px] bg-gradient-to-t from-indigo-500 to-cyan-400 opacity-85 hover:opacity-100 transition-opacity"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">Feb 26</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">Mar 12</span>
          </div>
        </div>
      </Surface>
    </div>
  )
}

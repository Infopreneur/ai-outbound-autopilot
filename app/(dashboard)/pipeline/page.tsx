import {
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle2,
  Sparkles,
  Filter,
} from 'lucide-react'
import { requireAccountContext } from '@/lib/auth/server'
import { PipelineBoard } from '@/components/pipeline-board'
import { Button } from '@/components/ui/button'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'
import { mapDealRow } from '@/lib/deals'
import { formatCurrency } from '@/lib/utils'

export default async function PipelinePage({
  searchParams,
}: {
  searchParams?: Promise<{ deal?: string }>
}) {
  const ctx = await requireAccountContext()
  const supabase = getUserSupabaseClient(ctx.accessToken)
  const params = await searchParams
  const highlightedDealId = params?.deal

  const { data, error } = await supabase
    .from('deals')
    .select(`
      id,
      name,
      owner,
      stage,
      value,
      probability,
      deep_dive_note,
      created_at,
      company_id,
      source_prospect_id,
      companies:company_id ( id, name )
    `)
    .eq('account_id', ctx.accountId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const deals = (data ?? []).map(mapDealRow)
  const won = deals.filter((d) => d.stage === 'closed_won')
  const active = deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage))
  const closed = deals.filter((d) => ['closed_won', 'closed_lost'].includes(d.stage))
  const pipeVal = active.reduce((s, d) => s + d.value, 0)
  const wonVal = won.reduce((s, d) => s + d.value, 0)
  const avgDeal = active.length > 0 ? Math.round(pipeVal / active.length) : 0
  const winRate = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Pipeline Value',
            value: formatCurrency(pipeVal),
            sub: `${active.length} active deals`,
            icon: <DollarSign className="w-4 h-4" />,
            color: 'text-indigo-400 bg-indigo-500/10',
          },
          {
            label: 'Won Revenue',
            value: formatCurrency(wonVal),
            sub: `${won.length} deals closed`,
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: 'text-emerald-400 bg-emerald-500/10',
          },
          {
            label: 'Avg Deal Size',
            value: formatCurrency(avgDeal),
            sub: 'Across active pipeline',
            icon: <TrendingUp className="w-4 h-4" />,
            color: 'text-violet-400 bg-violet-500/10',
          },
          {
            label: 'Win Rate',
            value: `${winRate}%`,
            sub: 'Closed won vs. lost',
            icon: <Target className="w-4 h-4" />,
            color: 'text-amber-400 bg-amber-500/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-bg-muted)_95%,white_5%)_0%,var(--panel-bg)_100%)] px-5 py-4 shadow-[0_18px_38px_rgba(15,23,42,0.05)]"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
              <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
              <div className="mt-0.5 text-[10px] text-[var(--text-subtle)]">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Deal Pipeline</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{active.length} active deals · {deals.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </Button>
          <Button variant="secondary" size="sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI Forecast
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <PipelineBoard deals={deals} highlightedDealId={highlightedDealId} />

      {/* Bottom: Deal insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* At-risk deals */}
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">At-Risk Deals</h3>
          </div>
          <div className="space-y-3">
            {deals
              .filter((d) => d.daysInStage > 7 && !['closed_won', 'closed_lost'].includes(d.stage))
              .slice(0, 3)
              .map((deal) => (
                <div key={deal.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">{deal.name}</div>
                    <div className="text-[11px] text-[var(--text-subtle)]">{deal.daysInStage}d in stage</div>
                  </div>
                  <div className="text-sm font-bold text-amber-400">{formatCurrency(deal.value)}</div>
                </div>
              ))}
            {deals.filter((d) => d.daysInStage > 7 && !['closed_won', 'closed_lost'].includes(d.stage)).length === 0 && (
              <div className="py-3 text-center text-xs text-[var(--text-subtle)]">No at-risk deals</div>
            )}
          </div>
        </div>

        {/* AI Forecast */}
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Forecast</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Commit',    value: formatCurrency(148000), color: 'text-emerald-400' },
              { label: 'Best Case', value: formatCurrency(224000), color: 'text-indigo-400' },
              { label: 'Pipeline',  value: formatCurrency(pipeVal), color: 'text-slate-300' },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">{f.label}</span>
                <span className={`text-sm font-bold ${f.color}`}>{f.value}</span>
              </div>
            ))}
            <div className="mt-2 border-t border-[var(--panel-border)] pt-3 text-xs text-[var(--text-subtle)]">
              <Sparkles className="w-3 h-3 inline mr-1 text-indigo-500" />
              Based on historical win rates and deal velocity
            </div>
          </div>
        </div>

        {/* Upcoming close dates */}
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Closing Soon</h3>
          </div>
          <div className="space-y-3">
            {deals
              .filter((d) => !['closed_won', 'closed_lost'].includes(d.stage))
              .sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime())
              .slice(0, 4)
              .map((deal) => (
                <div key={deal.id} className="flex items-center justify-between">
                  <div>
                    <div className="max-w-[160px] truncate text-xs font-semibold text-[var(--text-secondary)]">{deal.name}</div>
                    <div className="text-[11px] text-[var(--text-subtle)]">
                      {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{formatCurrency(deal.value)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

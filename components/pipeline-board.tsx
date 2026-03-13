'use client'

import { GripVertical, Calendar, User, TrendingUp } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import type { DealRecord, DealStage } from '@/lib/types/deals'

const STAGES: { key: DealStage; label: string; color: string; barColor: string }[] = [
  { key: 'prospecting',  label: 'Prospecting',  color: 'text-slate-400',   barColor: 'bg-slate-500' },
  { key: 'qualified',    label: 'Qualified',    color: 'text-blue-400',    barColor: 'bg-blue-500' },
  { key: 'demo',         label: 'Demo',         color: 'text-violet-400',  barColor: 'bg-violet-500' },
  { key: 'proposal',     label: 'Proposal',     color: 'text-amber-400',   barColor: 'bg-amber-500' },
  { key: 'negotiation',  label: 'Negotiation',  color: 'text-orange-400',  barColor: 'bg-orange-500' },
  { key: 'closed_won',   label: 'Closed Won',   color: 'text-emerald-400', barColor: 'bg-emerald-500' },
]

function DealCard({ deal, barColor, highlighted }: { deal: DealRecord; barColor: string; highlighted?: boolean }) {
  return (
    <div className={cn(
      'bg-[#1a1a30] border border-[#252540] rounded-lg p-3.5 hover:border-[#323258] hover:bg-[#1e1e36] transition-all duration-150 cursor-grab active:cursor-grabbing group',
      highlighted && 'border-indigo-500/60 bg-indigo-500/10 shadow-[0_0_0_1px_rgba(99,102,241,0.25)]',
    )}>
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100 leading-snug truncate">{deal.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">{deal.company}</div>
        </div>
        <GripVertical className="w-3.5 h-3.5 text-slate-700 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="text-lg font-bold text-white mb-2.5">{formatCurrency(deal.value)}</div>

      {deal.deepDiveNote && (
        <div className="mb-2.5 text-[11px] text-slate-400 line-clamp-2" title={deal.deepDiveNote}>
          {deal.deepDiveNote}
        </div>
      )}

      <div className="mb-2.5">
        <Progress value={deal.probability} barClassName={barColor} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <User className="w-3 h-3" />
            {deal.owner.split(' ')[0]}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Calendar className="w-3 h-3" />
            {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500">{deal.probability}%</span>
      </div>
    </div>
  )
}

interface PipelineBoardProps {
  deals: DealRecord[]
  highlightedDealId?: string
}

export function PipelineBoard({ deals, highlightedDealId }: PipelineBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.key)
        const total = stageDeals.reduce((s, d) => s + d.value, 0)

        return (
          <div key={stage.key} className="flex-shrink-0 w-[240px]">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', stage.barColor)} />
                <span className={cn('text-sm font-semibold', stage.color)}>{stage.label}</span>
                <span className="text-xs text-slate-700 bg-[#1a1a30] px-1.5 py-0.5 rounded-full border border-[#252540]">
                  {stageDeals.length}
                </span>
              </div>
            </div>

            {/* Value summary */}
            <div className="mb-3 px-1">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <TrendingUp className="w-3 h-3" />
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2.5 min-h-[80px]">
              {stageDeals.length === 0 ? (
                <div className="h-20 border-2 border-dashed border-[#1e1e38] rounded-lg flex items-center justify-center">
                  <span className="text-xs text-slate-700">No deals</span>
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    barColor={stage.barColor}
                    highlighted={deal.id === highlightedDealId}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

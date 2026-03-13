import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string
  change: number
  changeLabel?: string
  icon: ReactNode
  color?: 'indigo' | 'emerald' | 'violet' | 'amber' | 'red' | 'blue'
}

const colorMap = {
  indigo:  { icon: 'bg-indigo-500/15 text-indigo-500', glow: 'shadow-indigo-500/10', panel: 'bg-[linear-gradient(180deg,rgba(99,102,241,0.10)_0%,rgba(255,255,255,0.70)_100%)] border-indigo-200/70' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-500', glow: 'shadow-emerald-500/10', panel: 'bg-[linear-gradient(180deg,rgba(16,185,129,0.10)_0%,rgba(255,255,255,0.72)_100%)] border-emerald-200/80' },
  violet:  { icon: 'bg-violet-500/15 text-violet-500', glow: 'shadow-violet-500/10', panel: 'bg-[linear-gradient(180deg,rgba(168,85,247,0.10)_0%,rgba(255,255,255,0.72)_100%)] border-violet-200/80' },
  amber:   { icon: 'bg-amber-500/15 text-amber-500', glow: 'shadow-amber-500/10', panel: 'bg-[linear-gradient(180deg,rgba(245,158,11,0.10)_0%,rgba(255,255,255,0.74)_100%)] border-amber-200/80' },
  red:     { icon: 'bg-red-500/15 text-red-500', glow: 'shadow-red-500/10', panel: 'bg-[linear-gradient(180deg,rgba(239,68,68,0.10)_0%,rgba(255,255,255,0.74)_100%)] border-red-200/80' },
  blue:    { icon: 'bg-sky-500/15 text-sky-500', glow: 'shadow-sky-500/10', panel: 'bg-[linear-gradient(180deg,rgba(14,165,233,0.10)_0%,rgba(255,255,255,0.72)_100%)] border-sky-200/80' },
}

export function KpiCard({ title, value, change, changeLabel, icon, color = 'indigo' }: KpiCardProps) {
  const isPositive = change >= 0
  const colors = colorMap[color]

  return (
    <div
      className={cn(
        'border rounded-2xl p-5 hover:border-[color:color-mix(in_srgb,var(--panel-border)_75%,#6366f1_25%)] transition-all duration-200 shadow-[0_18px_40px_rgba(15,23,42,0.06)]',
        colors.panel,
        colors.glow,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colors.icon)}>
          {icon}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            isPositive
              ? 'bg-emerald-500/12 text-emerald-500'
              : 'bg-red-500/12 text-red-500',
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {isPositive ? '+' : ''}
          {change}%
        </div>
      </div>

      <div className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight leading-none mb-1">
        {value}
      </div>
      <div className="text-sm text-[var(--text-muted)] font-medium">{title}</div>
      {changeLabel && (
        <div className="text-xs text-[var(--text-subtle)] mt-1">{changeLabel}</div>
      )}
    </div>
  )
}

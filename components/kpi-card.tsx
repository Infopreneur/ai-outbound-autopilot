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
  indigo:  { icon: 'bg-indigo-500/15 text-indigo-400', glow: 'shadow-indigo-500/10' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-400', glow: 'shadow-emerald-500/10' },
  violet:  { icon: 'bg-violet-500/15 text-violet-400', glow: 'shadow-violet-500/10' },
  amber:   { icon: 'bg-amber-500/15 text-amber-400', glow: 'shadow-amber-500/10' },
  red:     { icon: 'bg-red-500/15 text-red-400', glow: 'shadow-red-500/10' },
  blue:    { icon: 'bg-blue-500/15 text-blue-400', glow: 'shadow-blue-500/10' },
}

export function KpiCard({ title, value, change, changeLabel, icon, color = 'indigo' }: KpiCardProps) {
  const isPositive = change >= 0
  const colors = colorMap[color]

  return (
    <div
      className={cn(
        'bg-[#111120] border border-[#1e1e38] rounded-xl p-5 hover:border-[#252548] transition-all duration-200 shadow-lg',
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
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400',
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

      <div className="text-[28px] font-bold text-white tracking-tight leading-none mb-1">
        {value}
      </div>
      <div className="text-sm text-slate-500 font-medium">{title}</div>
      {changeLabel && (
        <div className="text-xs text-slate-700 mt-1">{changeLabel}</div>
      )}
    </div>
  )
}

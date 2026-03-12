import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  showLabel?: boolean
}

export function Progress({ value, max = 100, className, barClassName, showLabel }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 rounded-full bg-[#1e1e38] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barClassName ?? 'bg-indigo-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 w-8 text-right">{Math.round(pct)}%</span>
      )}
    </div>
  )
}

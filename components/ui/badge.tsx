import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type BadgeVariant =
  | 'hot' | 'warm' | 'cold' | 'contacted' | 'qualified' | 'disqualified'
  | 'active' | 'paused' | 'draft' | 'completed'
  | 'prospect' | 'engaged' | 'demo' | 'customer' | 'churned'
  | 'default' | 'indigo' | 'emerald' | 'amber' | 'red' | 'violet' | 'blue'

const variantStyles: Record<BadgeVariant, string> = {
  hot:           'bg-red-500/15 text-red-400 border-red-500/25',
  warm:          'bg-amber-500/15 text-amber-400 border-amber-500/25',
  cold:          'bg-blue-500/15 text-blue-400 border-blue-500/25',
  contacted:     'bg-violet-500/15 text-violet-400 border-violet-500/25',
  qualified:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  disqualified:  'bg-slate-500/15 text-slate-400 border-slate-500/25',
  active:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  paused:        'bg-amber-500/15 text-amber-400 border-amber-500/25',
  draft:         'bg-slate-500/15 text-slate-400 border-slate-500/25',
  completed:     'bg-blue-500/15 text-blue-400 border-blue-500/25',
  prospect:      'bg-slate-500/15 text-slate-400 border-slate-500/25',
  engaged:       'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  demo:          'bg-violet-500/15 text-violet-400 border-violet-500/25',
  customer:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  churned:       'bg-red-500/15 text-red-400 border-red-500/25',
  default:       'bg-slate-500/15 text-slate-400 border-slate-500/25',
  indigo:        'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  emerald:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  amber:         'bg-amber-500/15 text-amber-400 border-amber-500/25',
  red:           'bg-red-500/15 text-red-400 border-red-500/25',
  violet:        'bg-violet-500/15 text-violet-400 border-violet-500/25',
  blue:          'bg-blue-500/15 text-blue-400 border-blue-500/25',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
        variantStyles[variant] ?? variantStyles.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

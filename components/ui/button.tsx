import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500/50',
  secondary: 'bg-[var(--panel-bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--panel-bg-muted)] border border-[var(--panel-border)] hover:text-[var(--text-primary)]',
  ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]',
  danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30',
  outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--input-border)] hover:border-indigo-500/50 hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]',
}

const sizes = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

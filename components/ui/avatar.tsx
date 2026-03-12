import { cn, getInitials } from '@/lib/utils'

const gradients = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
  'from-violet-500 to-purple-600',
]

function getGradient(name: string) {
  const idx = name.charCodeAt(0) % gradients.length
  return gradients[idx]
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white flex-shrink-0',
        getGradient(name),
        sizes[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}

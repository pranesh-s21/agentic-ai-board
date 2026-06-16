import { cn } from '@/lib/utils'

interface DuLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'mark' | 'white'
  className?: string
}

const sizes = {
  sm: { mark: 'text-lg', sub: 'text-[10px]' },
  md: { mark: 'text-2xl', sub: 'text-xs' },
  lg: { mark: 'text-3xl', sub: 'text-sm' },
}

export function DuLogo({ size = 'md', variant = 'full', className }: DuLogoProps) {
  const s = sizes[size]
  const isWhite = variant === 'white'

  if (variant === 'mark') {
    return (
      <span className={cn('inline-flex items-baseline font-bold leading-none tracking-tight', className)}>
        <span className={cn(s.mark, isWhite ? 'text-du-cyan-400' : 'text-du-cyan-500')}>d</span>
        <span className={cn(s.mark, isWhite ? 'text-du-magenta-300' : 'text-du-magenta-500')}>u</span>
      </span>
    )
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className={cn('inline-flex items-baseline font-bold leading-none', s.mark)}>
        <span className={isWhite ? 'text-du-cyan-400' : 'text-du-cyan-500'}>d</span>
        <span className={isWhite ? 'text-du-magenta-300' : 'text-du-magenta-500'}>u</span>
      </span>
      <div className={cn('border-l pl-2.5', isWhite ? 'border-white/20' : 'border-du-purple-200')}>
        <p className={cn('font-semibold leading-tight', s.sub, isWhite ? 'text-white' : 'text-du-purple-900')}>
          Board AI
        </p>
        <p className={cn('leading-tight font-medium', size === 'sm' ? 'text-[9px]' : 'text-[10px]', isWhite ? 'text-white/75' : 'text-navy-600')}>
          Executive Platform
        </p>
      </div>
    </div>
  )
}

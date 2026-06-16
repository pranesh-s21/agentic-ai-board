import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-du-purple-100 text-du-purple-800',
        official: 'bg-du-cyan-50 text-du-cyan-600 border border-du-cyan-200',
        draft: 'bg-du-magenta-50 text-du-magenta-700 border border-du-magenta-200',
        ai: 'bg-du-purple-50 text-du-purple-700 border border-du-purple-200',
        private: 'bg-du-purple-50/80 text-du-purple-600 border border-du-purple-100',
        restricted: 'bg-red-50 text-red-700 border border-red-200',
        approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        pending: 'bg-amber-50 text-amber-800 border border-amber-200',
        cited: 'bg-du-purple-50 text-du-purple-700 border border-du-purple-100',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-red-50 text-red-700',
        muted: 'bg-du-purple-50 text-navy-600 border border-du-purple-100',
        brand: 'bg-du-purple-900 text-white border-0 shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

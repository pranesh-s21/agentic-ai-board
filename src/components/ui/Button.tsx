import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-du-magenta-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-du-magenta-600 text-white shadow-sm hover:bg-du-magenta-700 hover:shadow-md active:scale-[0.98]',
        secondary: 'bg-du-purple-100 text-du-purple-900 hover:bg-du-purple-200',
        outline: 'border-2 border-du-magenta-500 bg-white text-du-magenta-600 hover:bg-du-magenta-50',
        ghost: 'text-du-purple-700 hover:bg-du-purple-50',
        purple: 'bg-du-purple-900 text-white shadow-sm hover:bg-du-purple-800 hover:shadow-md active:scale-[0.98]',
        teal: 'bg-du-cyan-500 text-white hover:bg-du-cyan-600 shadow-sm',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3.5 text-xs rounded-lg',
        lg: 'h-12 px-7 text-base rounded-xl',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = 'Button'

export { buttonVariants }

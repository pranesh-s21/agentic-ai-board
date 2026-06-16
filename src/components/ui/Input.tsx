import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-du-purple-200 bg-white px-3.5 py-2 text-sm text-du-purple-900 placeholder:text-du-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-du-magenta-400 focus-visible:ring-offset-1 focus-visible:border-du-magenta-300 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-du-purple-200 bg-white px-3.5 py-2 text-sm text-du-purple-900 placeholder:text-du-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-du-magenta-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-xl border border-du-purple-200 bg-white px-3.5 py-2 text-sm text-du-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-du-magenta-400 focus-visible:ring-offset-1',
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

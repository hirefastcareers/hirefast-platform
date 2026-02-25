import { forwardRef, type ButtonHTMLAttributes } from 'react'

const buttonVariants = {
  default:
    'bg-[#0d2547] text-white shadow-lg shadow-[#0d2547]/20 hover:bg-[#0d2547]/90 active:scale-[0.98]',
  outline:
    'border border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  link: 'text-[#0d2547] underline-offset-4 hover:underline',
}

const sizeVariants = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 rounded-lg px-3 text-sm',
  lg: 'h-12 rounded-xl px-6 text-base',
  icon: 'h-10 w-10',
  'icon-lg': 'h-12 w-12 rounded-xl',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof sizeVariants
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#f4601a]/20 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${buttonVariants[variant]} ${sizeVariants[size]} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }

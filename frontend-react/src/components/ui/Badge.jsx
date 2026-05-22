/**
 * Badge Component
 * Professional redesigned badge with dot indicator
 */

import { cn } from '@/utils/helpers'

const badgeVariants = {
  success: {
    base: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    dot: 'bg-emerald-500',
  },
  warning: {
    base: 'bg-amber-50 text-amber-700 border border-amber-200/70',
    dot: 'bg-amber-500',
  },
  danger: {
    base: 'bg-red-50 text-red-700 border border-red-200/70',
    dot: 'bg-red-500',
  },
  info: {
    base: 'bg-blue-50 text-blue-700 border border-blue-200/70',
    dot: 'bg-blue-500',
  },
  purple: {
    base: 'bg-violet-50 text-violet-700 border border-violet-200/70',
    dot: 'bg-violet-500',
  },
  teal: {
    base: 'bg-teal-50 text-teal-700 border border-teal-200/70',
    dot: 'bg-teal-500',
  },
  orange: {
    base: 'bg-orange-50 text-orange-700 border border-orange-200/70',
    dot: 'bg-orange-500',
  },
  default: {
    base: 'bg-slate-100 text-slate-600 border border-slate-200/70',
    dot: 'bg-slate-400',
  },
  // Solid variants
  'solid-blue': {
    base: 'bg-blue-600 text-white border border-blue-700',
    dot: 'bg-white',
  },
  'solid-green': {
    base: 'bg-emerald-600 text-white border border-emerald-700',
    dot: 'bg-white',
  },
  'solid-red': {
    base: 'bg-red-600 text-white border border-red-700',
    dot: 'bg-white',
  },
  'solid-violet': {
    base: 'bg-violet-600 text-white border border-violet-700',
    dot: 'bg-white',
  },
}

export function Badge({
  children,
  variant = 'default',
  dot = false,
  pulseDot = false,
  className,
  ...props
}) {
  const variantConfig = badgeVariants[variant] || badgeVariants.default

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-1 rounded-full',
        'text-xs font-semibold tracking-wide',
        'leading-none',
        variantConfig.base,
        className
      )}
      {...props}
    >
      {(dot || pulseDot) && (
        <span className="relative flex shrink-0 items-center justify-center">
          {pulseDot && (
            <span
              className={cn(
                'absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 animate-ping',
                variantConfig.dot
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-1.5 w-1.5',
              variantConfig.dot
            )}
          />
        </span>
      )}
      {children}
    </span>
  )
}

export default Badge

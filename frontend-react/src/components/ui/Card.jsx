/**
 * Card Component
 * Professional redesigned card container with variants
 */

import { cn } from '@/utils/helpers'

const cardVariants = {
  default: [
    'bg-white border border-slate-200/80',
    'shadow-card',
    'rounded-2xl',
  ].join(' '),
  gradient: [
    'border-0',
    'shadow-lg',
    'rounded-2xl',
    'overflow-hidden',
  ].join(' '),
  glass: [
    'glass-card',
    'rounded-2xl',
  ].join(' '),
  flat: [
    'bg-white border border-slate-100',
    'rounded-2xl',
  ].join(' '),
}

export function Card({
  children,
  className,
  hover = false,
  variant = 'default',
  ...props
}) {
  return (
    <div
      className={cn(
        cardVariants[variant] || cardVariants.default,
        hover && 'card-hover cursor-pointer',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, divided = false, ...props }) {
  return (
    <div
      className={cn(
        'px-6 pt-6 pb-4',
        divided && 'border-b border-slate-100 pb-4 mb-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn(
        'text-base font-semibold text-slate-800 tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p
      className={cn('text-sm text-slate-500 mt-0.5 leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card

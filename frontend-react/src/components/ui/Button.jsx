/**
 * Button Component
 * Professional redesigned button with gradient variants
 */

import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

const buttonVariants = {
  primary: [
    'bg-gradient-to-r from-blue-600 to-indigo-600',
    'text-white',
    'shadow-lg shadow-blue-500/25',
    'hover:from-blue-700 hover:to-indigo-700',
    'hover:shadow-xl hover:shadow-blue-500/30',
    'active:from-blue-800 active:to-indigo-800',
    'focus:ring-blue-500/40',
  ].join(' '),

  secondary: [
    'bg-white',
    'text-slate-700 border border-slate-200',
    'shadow-sm',
    'hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900',
    'hover:shadow',
    'active:bg-slate-100',
    'focus:ring-slate-400/30',
  ].join(' '),

  danger: [
    'bg-gradient-to-r from-red-500 to-rose-600',
    'text-white',
    'shadow-lg shadow-red-500/25',
    'hover:from-red-600 hover:to-rose-700',
    'hover:shadow-xl hover:shadow-red-500/30',
    'active:from-red-700 active:to-rose-800',
    'focus:ring-red-500/40',
  ].join(' '),

  success: [
    'bg-gradient-to-r from-emerald-500 to-teal-600',
    'text-white',
    'shadow-lg shadow-emerald-500/25',
    'hover:from-emerald-600 hover:to-teal-700',
    'hover:shadow-xl hover:shadow-emerald-500/30',
    'active:from-emerald-700 active:to-teal-800',
    'focus:ring-emerald-500/40',
  ].join(' '),

  outline: [
    'bg-transparent',
    'text-blue-600 border-2 border-blue-600',
    'hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700',
    'active:bg-blue-100',
    'focus:ring-blue-500/30',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-slate-600',
    'hover:bg-slate-100 hover:text-slate-900',
    'active:bg-slate-200',
    'focus:ring-slate-400/30',
  ].join(' '),

  violet: [
    'bg-gradient-to-r from-violet-500 to-purple-600',
    'text-white',
    'shadow-lg shadow-violet-500/25',
    'hover:from-violet-600 hover:to-purple-700',
    'hover:shadow-xl hover:shadow-violet-500/30',
    'focus:ring-violet-500/40',
  ].join(' '),
}

const buttonSizes = {
  xs: 'px-2.5 py-1.5 text-xs rounded-lg gap-1',
  sm: 'px-3.5 py-2 text-sm rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
  xl: 'px-8 py-4 text-base rounded-2xl gap-2.5',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  type = 'button',
  iconLeft,
  iconRight,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        'select-none',
        buttonVariants[variant] || buttonVariants.primary,
        buttonSizes[size] || buttonSizes.md,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        iconLeft && <span className="shrink-0">{iconLeft}</span>
      )}
      {children}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  )
}

export default Button

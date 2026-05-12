/**
 * Loading Component
 * Loading spinner and states
 */

import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

export function Loading({ size = 'md', text, className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )
}

export function LoadingOverlay({ text = 'Chargement...' }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <Loading size="lg" text={text} />
      </div>
    </div>
  )
}

export function LoadingPage({ text = 'Chargement...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  )
}

export default Loading

/**
 * Alert Component
 * Alert messages with variants
 */

import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'
import { cn } from '@/utils/helpers'

const alertVariants = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertCircle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
  },
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
  ...props
}) {
  const { container, icon: Icon } = alertVariants[variant]

  return (
    <div
      className={cn(
        'relative flex gap-3 p-4 border rounded-lg',
        container,
        className
      )}
      {...props}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1">
        {title && <h4 className="font-medium mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default Alert

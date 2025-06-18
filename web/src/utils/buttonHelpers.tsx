// utils/buttonHelpers.tsx
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { ButtonState } from '../hooks/useButtonFeedback'

export function getButtonIcon(state: ButtonState, defaultIcon: React.ReactNode) {
  switch (state) {
    case 'loading':
      return <Loader2 className="w-4 h-4 animate-spin" />
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-600" />
    default:
      return defaultIcon
  }
}

export function getButtonClassName(state: ButtonState, baseClassName = '') {
  const stateClasses = {
    loading: 'opacity-75',
    success: 'border-green-500 bg-green-50 text-green-700',
    error: 'border-red-500 bg-red-50 text-red-700',
    idle: ''
  }

  return `transition-all duration-200 ${baseClassName} ${stateClasses[state]}`
}

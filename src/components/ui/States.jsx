import { Loader2, AlertCircle, FileX } from 'lucide-react'
import Button from './Button'

function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizes[size]}`} />
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  )
}

function EmptyState({ 
  icon: Icon = FileX, 
  title = 'No data found', 
  description = 'Get started by adding some data.',
  action,
  actionLabel 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  )
}

function ErrorState({ 
  title = 'Something went wrong', 
  description = 'Please try again later.',
  onRetry 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>Try Again</Button>
      )}
    </div>
  )
}

export { LoadingSpinner, PageLoader, EmptyState, ErrorState }

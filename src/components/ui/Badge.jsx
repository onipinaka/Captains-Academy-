function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

function StatusDot({ status, className = '' }) {
  const colors = {
    paid: 'bg-green-500',
    current: 'bg-yellow-500',
    overdue: 'bg-red-500',
    new: 'bg-gray-400',
    present: 'bg-green-500',
    absent: 'bg-red-500',
    late: 'bg-yellow-500',
    holiday: 'bg-gray-400',
    active: 'bg-green-500',
    inactive: 'bg-gray-400'
  }

  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-gray-400'} ${className}`} />
  )
}

export { Badge, StatusDot }

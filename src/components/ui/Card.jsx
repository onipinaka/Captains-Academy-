function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm 
        ${hover ? 'hover:shadow-md hover:border-gray-300 cursor-pointer transition-all' : ''}
        ${className}`}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-800 ${className}`}>
      {children}
    </h3>
  )
}

function CardContent({ children, className = '' }) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  )
}

function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }

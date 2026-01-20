import { createContext, useContext } from 'react'

const TabsContext = createContext()

function Tabs({ value, onValueChange, children, className = '' }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className = '' }) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex gap-6 -mb-px">
        {children}
      </nav>
    </div>
  )
}

function TabsTrigger({ value, children, className = '' }) {
  const { value: activeValue, onValueChange } = useContext(TabsContext)
  const isActive = activeValue === value

  return (
    <button
      onClick={() => onValueChange(value)}
      className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
        ${isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } ${className}`}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className = '' }) {
  const { value: activeValue } = useContext(TabsContext)
  
  if (activeValue !== value) return null

  return (
    <div className={className}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
export default Tabs


import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  GraduationCap,
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

const menuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    path: '/dashboard'
  },
  {
    title: 'Students',
    icon: Users,
    path: '/students',
    children: [
      { title: 'All Students', path: '/students' },
      { title: 'Add Student', path: '/students/add' }
    ]
  },
  {
    title: 'Batches',
    icon: GraduationCap,
    path: '/batches',
    children: [
      { title: 'All Batches', path: '/batches' },
      { title: 'Create Batch', path: '/batches/create' }
    ]
  },
  {
    title: 'Tests',
    icon: FileText,
    path: '/tests',
    children: [
      { title: 'All Tests', path: '/tests' },
      { title: 'Create Test', path: '/tests/create' },
    ]
  },
  {
    title: 'Fees',
    icon: DollarSign,
    path: '/fees',
    children: [
      { title: 'Fee Dashboard', path: '/fees' },
      { title: 'History', path: '/fees/history' },
      { title: 'Add Payment', path: '/fees/add' }
    ]
  },
  {
    title: 'Attendance',
    icon: Calendar,
    path: '/attendance',
    children: [
      { title: 'Mark Attendance', path: '/attendance' },
      { title: 'Reports', path: '/attendance/reports' }
    ]
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
    children: [
      { title: 'Overview', path: '/analytics' },
      { title: 'Student Performance', path: '/analytics/student' },
      { title: 'Batch Performance', path: '/analytics/batch' }
    ]
  },
  {
    title: 'Expenses',
    icon: Wallet,
    path: '/expenses',
    children: [
      { title: 'All Expenses', path: '/expenses' },
      { title: 'Add Expense', path: '/expenses/add' }
    ]
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings'
  }
]

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState({})

  const toggleExpand = (title) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto w-64`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">CoachERP</span>
          </NavLink>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive(item.path) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </div>
                    {expandedItems[item.title] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedItems[item.title] && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsOpen(false)}
                          className={({ isActive }) =>
                            `block px-3 py-2 rounded-lg text-sm transition-colors
                            ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`
                          }
                        >
                          {child.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar

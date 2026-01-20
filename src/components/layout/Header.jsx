import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, User, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function Header({ onMenuClick }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64 lg:w-80">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search students, batches..."
              className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'Administrator'}</p>
              </div>
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

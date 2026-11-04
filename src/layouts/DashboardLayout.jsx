import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useDarkMode from '../hooks/useDarkMode'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Target, 
  FolderKanban, 
  CheckSquare, 
  LogOut,
  Menu,
  X,
  FileText,
  Settings as SettingsIcon,
  Moon,
  Sun
} from 'lucide-react' 

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useDarkMode()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Properties', path: '/dashboard/properties', icon: Building2 },
    { name: 'Customers', path: '/dashboard/customers', icon: Users },
    { name: 'Leads', path: '/dashboard/leads', icon: Target },
    { name: 'Projects', path: '/dashboard/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Settings', path: '/dashboard/settings', icon: SettingsIcon },
    { name: 'Reports', path: '/dashboard/reports', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">PropDesk CRM</h1>
          <button 
            className="lg:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                )}

                <Icon 
                  size={18} 
                  className={`transition-transform duration-200 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white group-hover:scale-110'
                  }`} 
                />
                <span>{item.name}</span>

                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User card at bottom */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8 transition-colors">
          <button 
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* 🌙 Dark Mode Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)} 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto bg-gray-50 dark:bg-gray-950 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useDarkMode from '../hooks/useDarkMode'
import {
  LayoutDashboard, Building2, Users, Target, FolderKanban,
  CheckSquare, LogOut, Menu, Settings as SettingsIcon, FileText,
  Moon, Sun, X, ChevronRight,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Properties', path: '/dashboard/properties', icon: Building2 },
      { name: 'Customers', path: '/dashboard/customers', icon: Users },
      { name: 'Leads', path: '/dashboard/leads', icon: Target },
      { name: 'Projects', path: '/dashboard/projects', icon: FolderKanban },
      { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Reports', path: '/dashboard/reports', icon: FileText },
      { name: 'Settings', path: '/dashboard/settings', icon: SettingsIcon },
    ],
  },
]

const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items)

// '/dashboard' matches only itself; other items match nested routes too
const matchesPath = (pathname, path) =>
  path === '/dashboard'
    ? pathname === '/dashboard'
    : pathname === path || pathname.startsWith(`${path}/`)

const EASE_OUT = 'ease-[cubic-bezier(0.22,1,0.36,1)]'

function UserAvatar({ initial, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white shadow-sm shadow-indigo-500/25 ${className}`}
    >
      {initial}
    </span>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useDarkMode()
  const [signingOut, setSigningOut] = useState(false)

  const userEmail = user?.email || ''
  const userInitial = userEmail[0]?.toUpperCase() || 'U'

  const pageTitle =
    NAV_ITEMS.find((item) => matchesPath(location.pathname, item.path))?.name ??
    (location.pathname.split('/').filter(Boolean).pop() || 'Dashboard').replace(/-/g, ' ')

  const handleLogout = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error(err)
      setSigningOut(false)
    }
  }

  // Close the mobile drawer on any route change (links, back/forward)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Esc closes the drawer; lock page scroll while it is open
  useEffect(() => {
    if (!isSidebarOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isSidebarOpen])

  // If the viewport grows to desktop while the drawer is open, close it
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e) => {
      if (e.matches) setIsSidebarOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 antialiased transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:bg-zinc-900 dark:focus:text-zinc-100"
      >
        Skip to content
      </a>

      {/* Mobile overlay */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* ---------- Sidebar ---------- */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col border-r border-zinc-200/70 bg-white transition-transform duration-300 ${EASE_OUT} dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/70 px-5 dark:border-zinc-800">
          <Link
            to="/dashboard"
            onClick={() => setIsSidebarOpen(false)}
            className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-500/25 ring-1 ring-inset ring-white/20 transition-transform duration-200 group-hover:scale-105">
              P
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white">
              PropDesk <span className="text-indigo-600 dark:text-indigo-400">CRM</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
            className="-mr-1 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/dashboard'}
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              aria-hidden="true"
                              className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-600 transition-all duration-200 dark:bg-indigo-400 ${
                                isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
                              }`}
                            />
                            <Icon
                              size={18}
                              strokeWidth={isActive ? 2.25 : 2}
                              aria-hidden="true"
                              className={`shrink-0 transition-colors ${
                                isActive
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-200'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="shrink-0 border-t border-zinc-200/70 p-3 dark:border-zinc-800">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <UserAvatar initial={userInitial} className="h-9 w-9 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                {userEmail || 'Signed in'}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Administrator</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              title="Logout"
              aria-label="Logout"
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------- Main area ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-zinc-200/70 bg-white/80 px-4 backdrop-blur-xl transition-colors sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              aria-controls="app-sidebar"
              aria-expanded={isSidebarOpen}
              className="-ml-2 rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Menu size={20} />
            </button>

            {/* Desktop breadcrumb */}
            <p className="hidden min-w-0 items-center gap-1.5 text-[13px] text-zinc-500 sm:flex dark:text-zinc-400">
              <span>PropDesk</span>
              <ChevronRight size={13} className="shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
              <span className="truncate font-medium capitalize text-zinc-800 dark:text-zinc-200">{pageTitle}</span>
            </p>

            {/* Mobile title */}
            <p className="truncate text-sm font-semibold capitalize text-zinc-900 sm:hidden dark:text-white">
              {pageTitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-zinc-200 sm:block dark:bg-zinc-700" />

            {/* User block */}
            <div className="hidden items-center gap-2.5 sm:flex">
              <UserAvatar initial={userInitial} className="h-8 w-8 text-xs" />
              <div className="hidden leading-tight md:block">
                <p className="max-w-[160px] truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                  {userEmail}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Administrator</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 dark:text-zinc-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto p-4 transition-colors focus:outline-none sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
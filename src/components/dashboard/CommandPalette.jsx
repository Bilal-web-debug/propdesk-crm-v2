import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, Building2, Users, Target,
  FolderKanban, CheckSquare, FileText, Settings, CornerDownLeft
} from 'lucide-react'

const COMMANDS = [
  { label: 'Dashboard',     path: '/dashboard',             icon: LayoutDashboard, keywords: 'home overview' },
  { label: 'Properties',    path: '/dashboard/properties',  icon: Building2,        keywords: 'listings houses' },
  { label: 'Customers',     path: '/dashboard/customers',   icon: Users,            keywords: 'clients contacts' },
  { label: 'Leads',         path: '/dashboard/leads',       icon: Target,           keywords: 'pipeline sales' },
  { label: 'Projects',      path: '/dashboard/projects',    icon: FolderKanban,     keywords: 'delivery' },
  { label: 'Tasks',         path: '/dashboard/tasks',       icon: CheckSquare,      keywords: 'todo' },
  { label: 'Reports',       path: '/dashboard/reports',     icon: FileText,         keywords: 'pdf export' },
  { label: 'Settings',      path: '/dashboard/settings',    icon: Settings,         keywords: 'profile account' },
]

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const results = useMemo(() => {
    if (!query.trim()) return COMMANDS
    const q = query.toLowerCase()
    return COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) || c.keywords.includes(q)
    )
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => { setActiveIndex(0) }, [query])

  const go = (cmd) => {
    navigate(cmd.path)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) go(results[activeIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-zinc-950/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-950/30 overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <Search size={16} className="text-zinc-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, jump anywhere…"
                className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                ESC
              </kbd>
            </div>

            <div className="max-h-[360px] overflow-y-auto py-1">
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-zinc-500">No results</p>
              ) : (
                results.map((cmd, i) => {
                  const Icon = cmd.icon
                  const active = i === activeIndex
                  return (
                    <button
                      key={cmd.path}
                      onClick={() => go(cmd)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'} />
                      <span className="flex-1 text-left font-medium">{cmd.label}</span>
                      {active && <CornerDownLeft size={13} className="text-indigo-400" />}
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400">
              <span>↑↓ Navigate · ↵ Open</span>
              <span>⌘K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
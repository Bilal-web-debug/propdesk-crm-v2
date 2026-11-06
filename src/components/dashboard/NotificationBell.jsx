import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Target, CheckSquare, Clock, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch on first open
  useEffect(() => {
    if (!open || fetched) return
    const load = async () => {
      try {
        setLoading(true)
        const [leadsRes, tasksRes] = await Promise.all([
          supabase.from('leads')
            .select('id, status, created_at, customers(full_name)')
            .order('created_at', { ascending: false })
            .limit(4),
          supabase.from('tasks')
            .select('id, title, due_date, status')
            .not('due_date', 'is', null)
            .in('status', ['todo', 'in_progress', 'review'])
            .order('due_date', { ascending: true })
            .limit(6),
        ])

        const now = new Date()
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const dueTasks = (tasksRes.data || []).filter(t => {
          const d = new Date(t.due_date)
          return d <= in7Days
        })

        const notifs = [
          ...dueTasks.map(t => ({
            type: 'task',
            id: `t-${t.id}`,
            title: t.title,
            subtitle: `Due ${new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
            link: '/dashboard/tasks',
            overdue: new Date(t.due_date) < now,
          })),
          ...(leadsRes.data || []).map(l => ({
            type: 'lead',
            id: `l-${l.id}`,
            title: l.customers?.full_name || 'New lead',
            subtitle: `Status: ${l.status.replace('_', ' ')}`,
            link: '/dashboard/leads',
            overdue: false,
          })),
        ]

        setItems(notifs)
        setFetched(true)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, fetched])

  const count = items.length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 z-50 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-950/20 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">Notifications</p>
              <span className="text-[11px] text-zinc-500">{count} item{count === 1 ? '' : 's'}</span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-2 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center">
                  <Inbox size={28} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                  <p className="text-[13px] text-zinc-500">All caught up</p>
                </div>
              ) : (
                items.map(item => {
                  const Icon = item.type === 'task' ? CheckSquare : Target
                  return (
                    <Link
                      key={item.id}
                      to={item.link}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.overdue
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : item.type === 'task'
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-white truncate">{item.title}</p>
                        <p className={`text-[11px] truncate flex items-center gap-1 ${
                          item.overdue ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400'
                        }`}>
                          {item.overdue && <Clock size={10} />}
                          {item.subtitle}
                        </p>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
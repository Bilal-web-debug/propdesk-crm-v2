import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  Building2, Users, Target, FolderKanban, CheckSquare, ArrowUpRight,
  TrendingUp, TrendingDown, Minus, Activity, Command, Search, LayoutDashboard,
  FileText, Settings, CornerDownLeft, Bell, Inbox, ChevronRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import useDarkMode from '../hooks/useDarkMode'

/* ============================================================
   CONSTANTS
   ============================================================ */
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const EMPTY_STATS = { properties: 0, customers: 0, leads: 0, projects: 0, tasks: 0 }
const REALTIME_TABLES = ['properties', 'customers', 'leads', 'projects', 'tasks']

const RANGE_OPTIONS = [
  { value: 3, label: '3M', full: 'Last 3 months' },
  { value: 6, label: '6M', full: 'Last 6 months' },
  { value: 12, label: '12M', full: 'Last 12 months' },
]

const KPI_CARDS = [
  {
    key: 'properties', title: 'Properties', link: '/dashboard/properties', icon: Building2,
    iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', bar: 'bg-blue-500',
  },
  {
    key: 'customers', title: 'Customers', link: '/dashboard/customers', icon: Users,
    iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', bar: 'bg-violet-500',
  },
  {
    key: 'leads', title: 'Leads', link: '/dashboard/leads', icon: Target,
    iconClass: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', bar: 'bg-orange-500',
  },
  {
    key: 'projects', title: 'Projects', link: '/dashboard/projects', icon: FolderKanban,
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', bar: 'bg-emerald-500',
  },
  {
    key: 'tasks', title: 'Tasks', link: '/dashboard/tasks', icon: CheckSquare,
    iconClass: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400', bar: 'bg-pink-500',
  },
]

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', path: '/dashboard/properties', icon: Building2 },
  { label: 'Customers', path: '/dashboard/customers', icon: Users },
  { label: 'Leads', path: '/dashboard/leads', icon: Target },
  { label: 'Projects', path: '/dashboard/projects', icon: FolderKanban },
  { label: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
  { label: 'Reports', path: '/dashboard/reports', icon: FileText },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
]

const STATUS_STYLES = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  sold: 'bg-zinc-100 text-zinc-700 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600/30',
  rented: 'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  new: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-400/20',
  contacted: 'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20',
  follow_up: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  closed_won: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  closed_lost: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20',
}
const DEFAULT_STATUS_STYLE = 'bg-zinc-100 text-zinc-600 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600/30'

const TREND_TONES = {
  up: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  down: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  flat: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

const cardClass =
  'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-zinc-800/80 dark:bg-zinc-900'

const labelize = (s = '') => String(s).toLowerCase().replace(/_/g, ' ')
const pct = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0)
const sumValues = (arr) => arr.reduce((acc, item) => acc + (item.value || 0), 0)

/* ============================================================
   INLINE HELPER COMPONENTS
   ============================================================ */
function AnimatedNumber({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { duration: 1200, bounce: 0 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())
  useEffect(() => { if (inView) motionVal.set(value) }, [inView, value, motionVal])
  return <motion.span ref={ref}>{display}</motion.span>
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[120px] rounded-xl border border-zinc-200 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95">
      {label && (
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="capitalize text-zinc-500 dark:text-zinc-400">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function Chip({ tone, icon: Icon, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${TREND_TONES[tone]}`}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  )
}

function TrendDelta({ current = 0, previous = 0 }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return <Chip tone="up" icon={TrendingUp}>New</Chip>
  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 0.05) return <Chip tone="flat" icon={Minus}>0%</Chip>
  const up = change > 0
  return (
    <Chip tone={up ? 'up' : 'down'} icon={up ? TrendingUp : TrendingDown}>
      {up ? '+' : ''}{change.toFixed(1)}%
    </Chip>
  )
}

function StatusPill({ status }) {
  if (!status) return null
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${STATUS_STYLES[status] || DEFAULT_STATUS_STYLE}`}>
      {labelize(status)}
    </span>
  )
}

function CardHeader({ icon: Icon, title, description, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {Icon && <Icon size={16} className="shrink-0 text-indigo-500" />}
          {title}
        </h2>
        {description && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {right}
    </div>
  )
}

function ViewAllLink({ to }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
    >
      View all <ArrowUpRight size={12} />
    </Link>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 py-8 text-center dark:border-zinc-800">
      <div className="rounded-full bg-zinc-100 p-2.5 text-zinc-400 dark:bg-zinc-800">
        <Icon size={16} />
      </div>
      <p className="text-sm text-zinc-500">{text}</p>
    </div>
  )
}

function LegendDot({ color, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
      <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</span>
    </span>
  )
}

function Donut({ data, innerRadius, outerRadius, centerValue, centerLabel, emptyText }) {
  return (
    <div className="relative h-full w-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              cornerRadius={6}
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-zinc-400">{emptyText}</div>
      )}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-white">
          <AnimatedNumber value={centerValue} />
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{centerLabel}</span>
      </div>
    </div>
  )
}

/* ============================================================
   MAIN DASHBOARD
   ============================================================ */
export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(EMPTY_STATS)
  const [prevStats, setPrevStats] = useState(EMPTY_STATS)
  const [chartData, setChartData] = useState([])
  const [propertyStatus, setPropertyStatus] = useState([])
  const [leadStatus, setLeadStatus] = useState([])
  const [recentProperties, setRecentProperties] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartMonths, setChartMonths] = useState(6)

  // Command palette
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [paletteIndex, setPaletteIndex] = useState(0)

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifFetched, setNotifFetched] = useState(false)
  const notifRef = useRef(null)

  const dmResult = useDarkMode?.() ?? false
  const isDark = Array.isArray(dmResult) ? dmResult[0] : !!dmResult

  /* ---------- Data ---------- */
  const fetchData = useCallback(async () => {
    try {
      const [propRes, custRes, leadRes, projRes, taskRes] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        properties: propRes.count || 0, customers: custRes.count || 0, leads: leadRes.count || 0,
        projects: projRes.count || 0, tasks: taskRes.count || 0,
      })

      const now = new Date()
      const windowStart = new Date(now.getFullYear(), now.getMonth() - (chartMonths - 1), 1)

      const [pProp, pCust, pLead, pProj, pTask] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }).lt('created_at', windowStart.toISOString()),
        supabase.from('customers').select('*', { count: 'exact', head: true }).lt('created_at', windowStart.toISOString()),
        supabase.from('leads').select('*', { count: 'exact', head: true }).lt('created_at', windowStart.toISOString()),
        supabase.from('projects').select('*', { count: 'exact', head: true }).lt('created_at', windowStart.toISOString()),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).lt('created_at', windowStart.toISOString()),
      ])
      setPrevStats({
        properties: pProp.count || 0, customers: pCust.count || 0, leads: pLead.count || 0,
        projects: pProj.count || 0, tasks: pTask.count || 0,
      })

      const { data: allProps } = await supabase.from('properties').select('status')
      const propStatusMap = { available: 0, sold: 0, rented: 0, pending: 0 }
      allProps?.forEach((prop) => { if (propStatusMap[prop.status] !== undefined) propStatusMap[prop.status]++ })
      setPropertyStatus(
        Object.keys(propStatusMap)
          .map((key) => ({ name: key.toUpperCase(), value: propStatusMap[key] }))
          .filter((i) => i.value > 0)
      )

      const { data: allLeads } = await supabase.from('leads').select('status')
      const leadStatusMap = { new: 0, contacted: 0, follow_up: 0, closed_won: 0, closed_lost: 0 }
      allLeads?.forEach((lead) => { if (leadStatusMap[lead.status] !== undefined) leadStatusMap[lead.status]++ })
      setLeadStatus(
        Object.keys(leadStatusMap)
          .map((key) => ({ name: labelize(key).toUpperCase(), value: leadStatusMap[key] }))
          .filter((i) => i.value > 0)
      )

      const { data: recentProps } = await supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(3)
      setRecentProperties(recentProps || [])

      const { data: recentLds } = await supabase
        .from('leads')
        .select('*, customers(full_name), properties(title)')
        .order('created_at', { ascending: false })
        .limit(3)
      setRecentLeads(recentLds || [])

      const months = []
      for (let i = 0; i < chartMonths; i++) {
        months.unshift(new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleString('default', { month: 'short' }))
      }
      const { data: propChart } = await supabase.from('properties').select('created_at').gte('created_at', windowStart.toISOString())
      const { data: leadChart } = await supabase.from('leads').select('created_at').gte('created_at', windowStart.toISOString())

      setChartData(
        months.map((month) => ({
          name: month,
          properties: propChart?.filter((p) => new Date(p.created_at).toLocaleString('default', { month: 'short' }) === month).length || 0,
          leads: leadChart?.filter((l) => new Date(l.created_at).toLocaleString('default', { month: 'short' }) === month).length || 0,
        }))
      )
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [chartMonths])

  useEffect(() => { fetchData() }, [fetchData])

  // Realtime: refetch when any tracked table changes
  useEffect(() => {
    const channel = supabase.channel('dash')
    REALTIME_TABLES.forEach((t) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => fetchData())
    })
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  /* ---------- Command palette: Cmd/Ctrl+K toggle ---------- */
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
        setPaletteQuery('')
        setPaletteIndex(0)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const openPalette = useCallback(() => {
    setPaletteQuery('')
    setPaletteIndex(0)
    setPaletteOpen(true)
  }, [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  const filteredNav = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase()
    return q ? NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q)) : NAV_ITEMS
  }, [paletteQuery])

  const activeIndex = Math.min(paletteIndex, Math.max(filteredNav.length - 1, 0))

  const goTo = (path) => {
    closePalette()
    navigate(path)
  }

  const onPaletteKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closePalette()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredNav.length) setPaletteIndex((i) => (i + 1) % filteredNav.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredNav.length) setPaletteIndex((i) => (i - 1 + filteredNav.length) % filteredNav.length)
    } else if (e.key === 'Enter') {
      const item = filteredNav[activeIndex]
      if (item) {
        e.preventDefault()
        goTo(item.path)
      }
    }
  }

  /* ---------- Notifications ---------- */
  useEffect(() => {
    if (!notifOpen || notifFetched) return
    const load = async () => {
      setNotifLoading(true)
      try {
        const [l, t] = await Promise.all([
          supabase.from('leads').select('id, status, customers(full_name)').order('created_at', { ascending: false }).limit(4),
          supabase
            .from('tasks')
            .select('id, title, due_date')
            .not('due_date', 'is', null)
            .in('status', ['todo', 'in_progress', 'review'])
            .order('due_date', { ascending: true })
            .limit(6),
        ])
        const now = new Date()
        const dueTasks = (t.data || []).filter(
          (x) => new Date(x.due_date) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        )

        setNotifs([
          ...dueTasks.map((x) => ({
            type: 'task',
            id: `t-${x.id}`,
            title: x.title,
            sub: `Due ${new Date(x.due_date).toLocaleDateString()}`,
            link: '/dashboard/tasks',
            overdue: new Date(x.due_date) < now,
          })),
          ...(l.data || []).map((x) => ({
            type: 'lead',
            id: `l-${x.id}`,
            title: x.customers?.full_name || 'Lead',
            sub: `Status: ${labelize(x.status)}`,
            link: '/dashboard/leads',
          })),
        ])
        setNotifFetched(true)
      } catch (err) {
        console.error(err)
      } finally {
        setNotifLoading(false)
      }
    }
    load()
  }, [notifOpen, notifFetched])

  // Close notifications on outside click
  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Close notifications on Escape
  useEffect(() => {
    if (!notifOpen) return
    const h = (e) => { if (e.key === 'Escape') setNotifOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [notifOpen])

  /* ---------- Derived ---------- */
  const theme = { grid: isDark ? '#3f3f46' : '#e4e4e7', axis: isDark ? '#71717a' : '#a1a1aa' }

  const chartTotals = useMemo(
    () => chartData.reduce(
      (acc, d) => ({ properties: acc.properties + d.properties, leads: acc.leads + d.leads }),
      { properties: 0, leads: 0 }
    ),
    [chartData]
  )
  const propertyTotal = useMemo(() => sumValues(propertyStatus), [propertyStatus])
  const leadTotal = useMemo(() => sumValues(leadStatus), [leadStatus])

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="relative mx-auto max-w-[1600px] space-y-6 pb-12">
      {/* Ambient backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-indigo-500/[0.07] via-violet-500/[0.03] to-transparent dark:from-indigo-400/[0.08] dark:via-violet-400/[0.02]" />

      {/* ============ HEADER ============ */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <LiveDot />
            Live workspace
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Activity size={14} className="shrink-0 text-emerald-500" aria-hidden="true" />
            <span>
              Tracking <span className="font-medium text-zinc-700 dark:text-zinc-200">{stats.properties}</span> properties,{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">{stats.leads}</span> leads and{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">{stats.tasks}</span> tasks.
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Command palette trigger */}
          <button
            type="button"
            onClick={openPalette}
            className="hidden h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 shadow-sm transition-all hover:border-indigo-300 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:inline-flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-indigo-500/50 dark:hover:text-zinc-100"
          >
            <Search size={15} className="text-zinc-400" />
            <span className="hidden md:inline">Search or jump</span>
            <kbd className="hidden items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-zinc-500 md:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={notifs.length ? `Notifications (${notifs.length})` : 'Notifications'}
              aria-expanded={notifOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <Bell size={17} />
              {notifs.length > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900" />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Notifications</span>
                    {notifs.length > 0 && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {notifs.length}
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="space-y-3 p-4">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                            <div className="flex-1 space-y-2">
                              <div className="h-2.5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                              <div className="h-2 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800/70" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifs.length === 0 ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <div className="mb-2 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                          <Inbox size={18} className="text-zinc-400" />
                        </div>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">All caught up</p>
                        <p className="mt-0.5 text-xs text-zinc-500">No upcoming tasks or new leads.</p>
                      </div>
                    ) : (
                      notifs.map((n) => (
                        <Link
                          key={n.id}
                          to={n.link}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-start gap-3 border-b border-zinc-100 px-4 py-3 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            n.overdue
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                          }`}>
                            {n.type === 'task' ? <CheckSquare size={14} /> : <Target size={14} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</p>
                            <p className={`truncate text-[11px] ${n.overdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-zinc-500'}`}>
                              {n.sub}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Range control */}
          <div className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {RANGE_OPTIONS.map((opt) => {
              const active = chartMonths === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-label={opt.full}
                  aria-pressed={active}
                  onClick={() => setChartMonths(opt.value)}
                  className={`h-8 rounded-lg px-3 text-xs font-semibold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </motion.header>

      {/* ============ KPI STRIP ============ */}
      {loading ? (
        <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-zinc-200/80 lg:grid-cols-5 dark:bg-zinc-800 ${cardClass}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 last:col-span-2 lg:last:col-span-1 dark:bg-zinc-900">
              <div className="flex h-full animate-pulse flex-col justify-between gap-5">
                <div className="h-9 w-9 rounded-xl bg-zinc-200/70 dark:bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-2.5 w-20 rounded bg-zinc-200/70 dark:bg-zinc-800" />
                  <div className="h-6 w-16 rounded bg-zinc-200/70 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-zinc-200/80 lg:grid-cols-5 dark:bg-zinc-800 ${cardClass}`}>
          {KPI_CARDS.map((c, i) => {
            const value = stats[c.key]
            return (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="relative bg-white last:col-span-2 lg:last:col-span-1 dark:bg-zinc-900"
              >
                <Link
                  to={c.link}
                  className="group relative flex h-full flex-col justify-between gap-5 p-5 transition-colors hover:bg-zinc-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:hover:bg-zinc-800/40"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 ${c.bar}`}
                  />
                  <div className="flex items-center justify-between">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${c.iconClass}`}>
                      <c.icon size={17} />
                    </span>
                    <ArrowUpRight
                      size={15}
                      aria-hidden="true"
                      className="text-zinc-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{c.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 md:text-[28px] dark:text-white">
                        <AnimatedNumber value={value} />
                      </p>
                      <TrendDelta current={value} previous={prevStats[c.key]} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ============ CHARTS ROW ============ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Activity trend */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className={`${cardClass} p-6 lg:col-span-3`}
        >
          <CardHeader
            icon={TrendingUp}
            title="Activity"
            description="Properties and leads added per month"
            right={
              <div className="hidden flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs sm:flex">
                <LegendDot color="#6366f1" label="Properties" value={chartTotals.properties} />
                <LegendDot color="#8b5cf6" label="Leads" value={chartTotals.leads} />
              </div>
            }
          />
          <div className="relative mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashGradProps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashGradLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.grid} />
                <XAxis dataKey="name" stroke={theme.axis} fontSize={12} tickLine={false} axisLine={false} dy={8} />
                <YAxis
                  stroke={theme.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                  padding={{ top: 16 }}
                />
                <Tooltip cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }} content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="properties"
                  name="Properties"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#dashGradProps)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                  animationDuration={1200}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#dashGradLeads)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
            {chartTotals.properties + chartTotals.leads === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
                No activity in this period
              </div>
            )}
          </div>
          {/* Mobile legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:hidden">
            <LegendDot color="#6366f1" label="Properties" value={chartTotals.properties} />
            <LegendDot color="#8b5cf6" label="Leads" value={chartTotals.leads} />
          </div>
        </motion.section>

        {/* Property mix */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className={`${cardClass} flex flex-col p-6 lg:col-span-2`}
        >
          <CardHeader icon={Building2} title="Property mix" description="Current inventory by status" />
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <Donut
                data={propertyStatus}
                innerRadius={54}
                outerRadius={78}
                centerValue={stats.properties}
                centerLabel="Total"
                emptyText="No properties"
              />
            </div>
            <ul className="w-full flex-1 space-y-3">
              {propertyStatus.length === 0 ? (
                <li className="text-center text-sm text-zinc-400 sm:text-left">Add a property to see its status mix.</li>
              ) : (
                propertyStatus.map((p, i) => {
                  const share = pct(p.value, propertyTotal)
                  const color = COLORS[i % COLORS.length]
                  return (
                    <li key={p.name}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium capitalize text-zinc-600 dark:text-zinc-300">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          {labelize(p.name)}
                        </span>
                        <span className="tabular-nums text-zinc-500">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.value}</span>
                          <span className="text-zinc-400"> · {share}%</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${share}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </motion.section>
      </div>

      {/* ============ BOTTOM ROW ============ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent properties */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
          className={`${cardClass} p-6`}
        >
          <CardHeader
            icon={Building2}
            title="Recent properties"
            right={<ViewAllLink to="/dashboard/properties" />}
          />
          <div className="mt-4">
            {recentProperties.length > 0 ? (
              <ul className="-mx-2 space-y-1">
                {recentProperties.map((p, i) => (
                  <li key={p.id ?? i}>
                    <Link
                      to="/dashboard/properties"
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.title || 'Untitled property'}</p>
                        <p className="truncate text-xs text-zinc-500">{p.location || 'No location'}</p>
                      </div>
                      <StatusPill status={p.status} />
                      <ChevronRight size={14} className="shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Building2} text="No properties yet." />
            )}
          </div>
        </motion.section>

        {/* Latest leads */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45 }}
          className={`${cardClass} p-6`}
        >
          <CardHeader
            icon={Target}
            title="Latest leads"
            right={<ViewAllLink to="/dashboard/leads" />}
          />
          <div className="mt-4">
            {recentLeads.length > 0 ? (
              <ul className="-mx-2 space-y-1">
                {recentLeads.map((l, i) => (
                  <li key={l.id ?? i}>
                    <Link
                      to="/dashboard/leads"
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                        <Target size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{l.customers?.full_name || 'Unknown customer'}</p>
                        <p className="truncate text-xs text-zinc-500">{l.properties?.title || 'No property linked'}</p>
                      </div>
                      <StatusPill status={l.status} />
                      <ChevronRight size={14} className="shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Target} text="No leads yet." />
            )}
          </div>
        </motion.section>

        {/* Lead pipeline */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.45 }}
          className={`${cardClass} flex flex-col p-6`}
        >
          <CardHeader icon={FolderKanban} title="Lead pipeline" description="Distribution across stages" />
          <div className="mx-auto mt-5 h-44 w-44">
            <Donut
              data={leadStatus}
              innerRadius={50}
              outerRadius={74}
              centerValue={stats.leads}
              centerLabel="Leads"
              emptyText="No lead data"
            />
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-2">
            {leadStatus.length === 0 ? (
              <li className="col-span-2 text-center text-xs text-zinc-400">Stages will appear once leads exist.</li>
            ) : (
              leadStatus.map((item, i) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-2.5 py-2 text-xs dark:bg-zinc-800/40"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate font-medium capitalize text-zinc-600 dark:text-zinc-300">{labelize(item.name)}</span>
                  </span>
                  <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.value}
                    <span className="ml-0.5 font-normal text-zinc-400">· {pct(item.value, leadTotal)}%</span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </motion.section>
      </div>

      {/* ============ COMMAND PALETTE ============ */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/40 px-4 pt-[12vh] backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closePalette() }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Quick jump"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
                <Search size={17} className="shrink-0 text-zinc-400" aria-hidden="true" />
                <input
                  autoFocus
                  value={paletteQuery}
                  onChange={(e) => { setPaletteQuery(e.target.value); setPaletteIndex(0) }}
                  onKeyDown={onPaletteKey}
                  placeholder="Jump to a page…"
                  aria-label="Jump to a page"
                  aria-controls="palette-results"
                  aria-activedescendant={filteredNav[activeIndex] ? `palette-item-${activeIndex}` : undefined}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
                />
                <kbd className="hidden shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-zinc-500 sm:inline-block dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  Esc
                </kbd>
              </div>

              <div id="palette-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
                {filteredNav.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-zinc-500">No pages match “{paletteQuery}”.</p>
                ) : (
                  filteredNav.map((item, i) => {
                    const active = i === activeIndex
                    const Icon = item.icon
                    return (
                      <button
                        key={item.path}
                        id={`palette-item-${i}`}
                        role="option"
                        aria-selected={active}
                        type="button"
                        onMouseEnter={() => setPaletteIndex(i)}
                        onClick={() => goTo(item.path)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          active
                            ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-100'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <Icon size={16} className={active ? 'text-indigo-500' : 'text-zinc-400'} />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {active && <CornerDownLeft size={13} className="text-indigo-400" />}
                      </button>
                    )
                  })
                )}
              </div>

              <div className="flex items-center gap-4 border-t border-zinc-200 bg-zinc-50/70 px-4 py-2.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>Esc Close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

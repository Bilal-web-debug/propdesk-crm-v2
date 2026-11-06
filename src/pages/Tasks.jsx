import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, X, Pencil, Trash2, CheckSquare, FolderKanban, Calendar, Flag,
  ChevronDown, SearchX, AlertCircle,
} from 'lucide-react'
import SearchFilter from '../components/SearchFilter'
import toast from 'react-hot-toast'

/* ============================================================
   STYLE TOKENS
   ============================================================ */
const CARD =
  'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-zinc-800/80 dark:bg-zinc-900'

const INPUT =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100 dark:[color-scheme:dark]'

const TH =
  'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'

const ICON_BTN =
  'rounded-lg p-2 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400'

const EMPTY_FORM = {
  project_id: '', title: '', description: '', status: 'todo', priority: 'medium', due_date: '',
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const FILTER_OPTIONS = [{ value: 'all', label: 'All' }, ...STATUS_OPTIONS]

const STATUS_STYLES = {
  todo: {
    badge: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-700/40 dark:text-zinc-300 dark:ring-zinc-500/30',
    dot: 'bg-zinc-400',
  },
  in_progress: {
    badge: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
    dot: 'bg-blue-500',
  },
  review: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
  },
  done: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
    dot: 'bg-emerald-500',
  },
}
const DEFAULT_STATUS = {
  badge: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300',
  dot: 'bg-zinc-400',
}

const PRIORITY_STYLES = {
  low: { dot: 'bg-zinc-400', text: 'text-zinc-600 dark:text-zinc-400' },
  medium: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  high: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
}

const TAG_TONES = {
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

const statusLabel = (status) =>
  STATUS_OPTIONS.find((o) => o.value === status)?.label ??
  (status ? String(status).replace(/_/g, ' ') : 'Unknown')

const priorityLabel = (priority) =>
  PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? 'Low'

/* ============================================================
   DATE HELPERS
   ============================================================ */

// Parse 'YYYY-MM-DD' as a local calendar date (avoids UTC off-by-one)
function parseDate(value) {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const fmtDate = (value) => {
  const d = parseDate(value)
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

function isOverdue(task, today) {
  const due = parseDate(task.due_date)
  return Boolean(due) && task.status !== 'done' && due < today
}

/* ============================================================
   PRESENTATIONAL HELPERS
   ============================================================ */
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || DEFAULT_STATUS
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

function PriorityBadge({ priority }) {
  if (!priority) return <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {priorityLabel(priority)}
    </span>
  )
}

function Tag({ tone, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_TONES[tone]}`}>
      {children}
    </span>
  )
}

function TaskCheck({ done }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
        done
          ? 'border-emerald-500 bg-emerald-500 text-white'
          : 'border-zinc-300 text-transparent dark:border-zinc-600'
      }`}
    >
      <CheckSquare size={11} strokeWidth={3} />
    </span>
  )
}

function TaskTitle({ task, className = '' }) {
  const done = task.status === 'done'
  return (
    <p
      className={`truncate text-sm font-semibold ${
        done ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-900 dark:text-white'
      } ${className}`}
      title={task.title}
    >
      {task.title}
    </p>
  )
}

function DueCell({ task, today }) {
  if (!task.due_date) return <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>

  const due = parseDate(task.due_date)
  const done = task.status === 'done'
  const overdue = isOverdue(task, today)
  const dueToday = !done && due && due.getTime() === today.getTime()

  return (
    <div className="flex flex-wrap items-center gap-1.5 whitespace-nowrap">
      <span
        className={`inline-flex items-center gap-1.5 text-[12.5px] tabular-nums ${
          overdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-zinc-600 dark:text-zinc-400'
        }`}
      >
        <Calendar size={13} aria-hidden="true" className={`shrink-0 ${overdue ? 'text-rose-500' : 'text-zinc-400'}`} />
        {fmtDate(task.due_date)}
      </span>
      {overdue && (
        <Tag tone="rose">
          <AlertCircle size={10} aria-hidden="true" />
          Overdue
        </Tag>
      )}
      {dueToday && <Tag tone="amber">Today</Tag>}
    </div>
  )
}

function ProjectCell({ name }) {
  if (!name) return <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
  return (
    <span className="inline-flex max-w-[220px] items-center gap-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
      <FolderKanban size={13} className="shrink-0 opacity-60" aria-hidden="true" />
      <span className="truncate" title={name}>{name}</span>
    </span>
  )
}

function RowActions({ name, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit task ${name || ''}`.trim()}
        className={`${ICON_BTN} hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400`}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete task ${name || ''}`.trim()}
        className={`${ICON_BTN} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function FieldLabel({ htmlFor, icon: Icon, optional = false, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
    >
      {Icon && <Icon size={13} className="text-zinc-400" aria-hidden="true" />}
      {children}
      {optional && <span className="font-normal text-zinc-400">(optional)</span>}
    </label>
  )
}

function SelectField({ id, label, icon, optional = false, children, ...props }) {
  return (
    <div>
      <FieldLabel htmlFor={id} icon={icon} optional={optional}>{label}</FieldLabel>
      <div className="relative">
        <select id={id} className={`${INPUT} appearance-none pr-9`} {...props}>
          {children}
        </select>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
      </div>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800" aria-busy="true" aria-label="Loading tasks">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 p-4">
          <div className="h-5 w-5 shrink-0 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
          <div className="hidden h-5 w-20 rounded-full bg-zinc-100 sm:block dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasAnyTasks, showClear, onClear }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        {hasAnyTasks ? <SearchX size={22} /> : <CheckSquare size={22} />}
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {hasAnyTasks ? 'No tasks match your filters' : 'No tasks yet'}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {hasAnyTasks
          ? 'Try a different search term or status.'
          : 'Add your first task to start tracking execution.'}
      </p>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg px-2 py-1 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

/* ============================================================
   MAIN
   ============================================================ */
export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  /* ---------- Data ---------- */
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, projects (name)`)
        .order('created_at', { ascending: false })
      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('projects').select('id, name')
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      toast.error(error.message)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [fetchTasks, fetchProjects])

  /* ---------- Modal: Esc to close + scroll lock ---------- */
  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) setIsModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isModalOpen, submitting])

  /* ---------- Modal open ---------- */
  function openModal(task = null) {
    if (task) {
      setEditingId(task.id)
      setFormData({
        project_id: task.project_id ?? '',
        title: task.title ?? '',
        description: task.description ?? '',
        status: task.status ?? 'todo',
        priority: task.priority ?? 'medium',
        due_date: task.due_date ?? '',
      })
    } else {
      setEditingId(null)
      setFormData(EMPTY_FORM)
    }
    setIsModalOpen(true)
  }

  const setField = (key) => (e) => {
    const value = e.target.value
    setFormData((f) => ({ ...f, [key]: value }))
  }

  /* ---------- Create / update ---------- */
  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = {
        project_id: formData.project_id || null,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
      }

      if (editingId) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tasks').insert([payload])
        if (error) throw error
      }

      setIsModalOpen(false)
      toast.success(editingId ? 'Task updated' : 'Task created')
      fetchTasks()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- Delete ---------- */
  async function handleDelete(id) {
    if (!window.confirm('Delete this task?')) return
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      toast.success('Task deleted')
      fetchTasks()
    } catch (error) {
      toast.error(error.message)
    }
  }

  /* ---------- Derived ---------- */
  const today = startOfToday()

  const filteredTasks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (!q) return true
      return [t.title, t.description, t.projects?.name].some((field) =>
        String(field ?? '').toLowerCase().includes(q)
      )
    })
  }, [tasks, searchTerm, statusFilter])

  const statusCounts = useMemo(() => {
    const counts = { all: tasks.length }
    STATUS_OPTIONS.forEach((o) => { counts[o.value] = 0 })
    tasks.forEach((t) => {
      if (t.status && t.status in counts && t.status !== 'all') counts[t.status]++
    })
    return counts
  }, [tasks])

  const overdueCount = useMemo(
    () => tasks.filter((t) => isOverdue(t, today)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, today.getTime()]
  )

  const hasActiveFilters = Boolean(searchTerm.trim()) || statusFilter !== 'all'
  const clearFilters = () => { setSearchTerm(''); setStatusFilter('all') }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12 animate-fade-up">

      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
            Execution
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl dark:text-white">
            Tasks
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{tasks.length}</span> total
            {hasActiveFilters && (
              <>
                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{filteredTasks.length}</span> shown
              </>
            )}
            {overdueCount > 0 && (
              <>
                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                <span className="font-medium tabular-nums text-rose-600 dark:text-rose-400">{overdueCount} overdue</span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          Add Task
        </button>
      </header>

      {/* ---------- Table card (toolbar + body) ---------- */}
      <section className={`${CARD} overflow-hidden`}>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-zinc-200/70 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800">
          <div className="min-w-0 lg:max-w-md lg:flex-1">
            <SearchFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search title, description, or project..."
            />
          </div>

          <div
            role="group"
            aria-label="Filter by status"
            className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5 lg:mx-0 lg:px-0"
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  {opt.label}
                  <span
                    className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                      active
                        ? 'bg-white/20 dark:bg-zinc-900/10'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {statusCounts[opt.value] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <LoadingRows />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            hasAnyTasks={tasks.length > 0}
            showClear={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
              {filteredTasks.map((t) => (
                <li key={t.id} className="p-4">
                  <div className="flex gap-3.5">
                    <div className="pt-0.5">
                      <TaskCheck done={t.status === 'done'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <TaskTitle task={t} />
                        <RowActions
                          name={t.title}
                          onEdit={() => openModal(t)}
                          onDelete={() => handleDelete(t.id)}
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                      </div>
                      {t.description && (
                        <p className="mt-2 line-clamp-2 text-[13px] text-zinc-500 dark:text-zinc-400">
                          {t.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-col gap-2">
                        <ProjectCell name={t.projects?.name} />
                        <DueCell task={t} today={today} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <th scope="col" className={`${TH} pl-5`}>Task</th>
                    <th scope="col" className={TH}>Project</th>
                    <th scope="col" className={TH}>Status</th>
                    <th scope="col" className={TH}>Priority</th>
                    <th scope="col" className={TH}>Due date</th>
                    <th scope="col" className={`${TH} pr-5 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="group transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30">
                      <td className="py-3 pl-5 pr-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <TaskCheck done={t.status === 'done'} />
                          <div className="min-w-0">
                            <TaskTitle task={t} className="max-w-[300px]" />
                            {t.description && (
                              <p className="max-w-[320px] truncate text-xs text-zinc-500 dark:text-zinc-400" title={t.description}>
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <ProjectCell name={t.projects?.name} />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>

                      <td className="px-4 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>

                      <td className="px-4 py-3">
                        <DueCell task={t} today={today} />
                      </td>

                      <td className="py-3 pl-4 pr-5">
                        <div className="opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <RowActions
                            name={t.title}
                            onEdit={() => openModal(t)}
                            onDelete={() => handleDelete(t.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ---------- Add / Edit modal ---------- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) setIsModalOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200/70 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800">
              <div className="min-w-0">
                <h2 id="task-modal-title" className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {editingId ? 'Edit task' : 'Add task'}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {editingId ? 'Update the task details below.' : 'Define a task and assign it to a project.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className="-mr-1 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" aria-busy={submitting}>
              {/* Scrollable fields */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <div>
                  <FieldLabel htmlFor="task-title">Task title</FieldLabel>
                  <input
                    id="task-title"
                    required
                    autoFocus
                    type="text"
                    value={formData.title}
                    onChange={setField('title')}
                    placeholder="e.g. Finalize listing photos"
                    className={INPUT}
                  />
                </div>

                <SelectField
                  id="task-project"
                  label="Project"
                  icon={FolderKanban}
                  optional
                  value={formData.project_id}
                  onChange={setField('project_id')}
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </SelectField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    id="task-status"
                    label="Status"
                    value={formData.status}
                    onChange={setField('status')}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </SelectField>

                  <SelectField
                    id="task-priority"
                    label="Priority"
                    icon={Flag}
                    value={formData.priority}
                    onChange={setField('priority')}
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </SelectField>
                </div>

                <div>
                  <FieldLabel htmlFor="task-due" icon={Calendar}>Due date</FieldLabel>
                  <input
                    id="task-due"
                    type="date"
                    value={formData.due_date}
                    onChange={setField('due_date')}
                    className={`${INPUT} tabular-nums`}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="task-description">Description</FieldLabel>
                  <textarea
                    id="task-description"
                    rows={3}
                    value={formData.description}
                    onChange={setField('description')}
                    placeholder="Add details, acceptance criteria, or notes…"
                    className={`${INPUT} resize-none`}
                  />
                </div>
              </div>

              {/* Footer (always visible) */}
              <div className="shrink-0 border-t border-zinc-200/70 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900"
                >
                  {submitting ? 'Saving...' : 'Save task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
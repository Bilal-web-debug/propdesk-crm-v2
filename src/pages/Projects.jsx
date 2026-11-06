import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, X, Pencil, Trash2, FolderKanban, Calendar, Wallet, ArrowRight,
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
  name: '', description: '', status: 'planning', start_date: '', end_date: '', budget: '',
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
]

const FILTER_OPTIONS = [{ value: 'all', label: 'All' }, ...STATUS_OPTIONS]

const STATUS_STYLES = {
  planning: {
    badge: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-700/40 dark:text-zinc-300 dark:ring-zinc-500/30',
    dot: 'bg-zinc-400',
  },
  in_progress: {
    badge: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
    dot: 'bg-blue-500',
  },
  completed: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
    dot: 'bg-emerald-500',
  },
  on_hold: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
  },
}
const DEFAULT_STATUS = {
  badge: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300',
  dot: 'bg-zinc-400',
}

const statusLabel = (status) =>
  STATUS_OPTIONS.find((o) => o.value === status)?.label ??
  (status ? String(status).replace(/_/g, ' ') : 'Unknown')

/* ============================================================
   DATE & FORMAT HELPERS
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

const formatBudget = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isNaN(n) ? '—' : `$${n.toLocaleString()}`
}

function isOverdue(project, today) {
  const end = parseDate(project.end_date)
  return Boolean(end) && end < today && project.status !== 'completed'
}

// Percentage of the timeline elapsed, or null when dates are missing or invalid
function timelineProgress(project, today) {
  const start = parseDate(project.start_date)
  const end = parseDate(project.end_date)
  if (!start || !end || end <= start) return null
  if (project.status === 'completed') return 100
  const ratio = (today - start) / (end - start)
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100)
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

function ProjectMark({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/25 ${className}`}
    >
      <FolderKanban size={16} />
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
        aria-label={`Edit ${name || 'project'}`}
        className={`${ICON_BTN} hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400`}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete ${name || 'project'}`}
        className={`${ICON_BTN} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function TimelineCell({ project, today }) {
  const start = fmtDate(project.start_date)
  const end = fmtDate(project.end_date)
  const overdue = isOverdue(project, today)
  const progress = timelineProgress(project, today)

  return (
    <div className="min-w-[180px]">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 whitespace-nowrap text-[12.5px] text-zinc-600 dark:text-zinc-400">
        <Calendar size={13} className="shrink-0 text-zinc-400" aria-hidden="true" />
        <span className="tabular-nums">{start}</span>
        <ArrowRight size={11} className="shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
        <span className={`tabular-nums ${overdue ? 'font-medium text-rose-600 dark:text-rose-400' : ''}`}>{end}</span>
        {overdue && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertCircle size={10} aria-hidden="true" />
            Overdue
          </span>
        )}
      </div>
      {progress !== null && (
        <div className="mt-2 flex items-center gap-2">
          <div
            role="progressbar"
            aria-label="Timeline progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${overdue ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-8 text-right text-[10px] font-medium tabular-nums text-zinc-400">{progress}%</span>
        </div>
      )}
    </div>
  )
}

function BudgetCell({ value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
      <Wallet size={13} className="shrink-0 text-zinc-400" aria-hidden="true" />
      {formatBudget(value)}
    </span>
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

function SelectField({ id, label, icon, children, ...props }) {
  return (
    <div>
      <FieldLabel htmlFor={id} icon={icon}>{label}</FieldLabel>
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
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800" aria-busy="true" aria-label="Loading projects">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 p-4">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
          <div className="hidden h-5 w-20 rounded-full bg-zinc-100 sm:block dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasAnyProjects, showClear, onClear }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        {hasAnyProjects ? <SearchX size={22} /> : <FolderKanban size={22} />}
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {hasAnyProjects ? 'No projects match your filters' : 'No projects yet'}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {hasAnyProjects
          ? 'Try a different search term or status.'
          : 'Create your first project to start tracking delivery.'}
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
export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  /* ---------- Data ---------- */
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

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
  function openModal(project = null) {
    if (project) {
      setEditingId(project.id)
      setFormData({
        name: project.name ?? '',
        description: project.description ?? '',
        status: project.status ?? 'planning',
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        budget: project.budget ?? '',
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
        name: formData.name,
        description: formData.description,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      }

      if (editingId) {
        const { error } = await supabase.from('projects').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('projects').insert([payload])
        if (error) throw error
      }

      setIsModalOpen(false)
      toast.success(editingId ? 'Project updated' : 'Project created')
      fetchProjects()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- Delete ---------- */
  async function handleDelete(id) {
    if (!window.confirm('Delete this project? All associated tasks will also be deleted.')) return
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      toast.success('Project deleted')
      fetchProjects()
    } catch (error) {
      toast.error(error.message)
    }
  }

  /* ---------- Derived: filtering & counts ---------- */
  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (!q) return true
      return [p.name, p.description].some((field) =>
        String(field ?? '').toLowerCase().includes(q)
      )
    })
  }, [projects, searchTerm, statusFilter])

  const statusCounts = useMemo(() => {
    const counts = { all: projects.length }
    STATUS_OPTIONS.forEach((o) => { counts[o.value] = 0 })
    projects.forEach((p) => {
      if (p.status && p.status in counts && p.status !== 'all') counts[p.status]++
    })
    return counts
  }, [projects])

  const hasActiveFilters = Boolean(searchTerm.trim()) || statusFilter !== 'all'
  const clearFilters = () => { setSearchTerm(''); setStatusFilter('all') }

  const today = startOfToday()

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12 animate-fade-up">

      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
            Delivery
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl dark:text-white">
            Projects
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{projects.length}</span> total
            {hasActiveFilters && (
              <>
                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{filteredProjects.length}</span> shown
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
          Add Project
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
              placeholder="Search project name or description..."
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
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            hasAnyProjects={projects.length > 0}
            showClear={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
              {filteredProjects.map((p) => (
                <li key={p.id} className="p-4">
                  <div className="flex gap-3.5">
                    <ProjectMark className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{p.name}</p>
                        <RowActions
                          name={p.name}
                          onEdit={() => openModal(p)}
                          onDelete={() => handleDelete(p.id)}
                        />
                      </div>
                      <div className="mt-1.5">
                        <StatusBadge status={p.status} />
                      </div>
                      {p.description && (
                        <p className="mt-2 line-clamp-2 text-[13px] text-zinc-500 dark:text-zinc-400">
                          {p.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-col gap-2.5">
                        <BudgetCell value={p.budget} />
                        <TimelineCell project={p} today={today} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <th scope="col" className={`${TH} pl-5`}>Project</th>
                    <th scope="col" className={TH}>Status</th>
                    <th scope="col" className={TH}>Budget</th>
                    <th scope="col" className={TH}>Timeline</th>
                    <th scope="col" className={`${TH} pr-5 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="group transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30">
                      <td className="py-3 pl-5 pr-4 align-middle">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProjectMark className="h-9 w-9" />
                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate text-sm font-semibold text-zinc-900 dark:text-white" title={p.name}>
                              {p.name}
                            </p>
                            {p.description && (
                              <p className="max-w-[300px] truncate text-xs text-zinc-500 dark:text-zinc-400" title={p.description}>
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <StatusBadge status={p.status} />
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <BudgetCell value={p.budget} />
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <TimelineCell project={p} today={today} />
                      </td>

                      <td className="py-3 pl-4 pr-5 align-middle">
                        <div className="opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <RowActions
                            name={p.name}
                            onEdit={() => openModal(p)}
                            onDelete={() => handleDelete(p.id)}
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
            aria-labelledby="project-modal-title"
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200/70 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800">
              <div className="min-w-0">
                <h2 id="project-modal-title" className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {editingId ? 'Edit project' : 'Add project'}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {editingId ? 'Update the project details below.' : 'Define scope, budget, and timeline.'}
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
                  <FieldLabel htmlFor="proj-name">Project name</FieldLabel>
                  <input
                    id="proj-name"
                    required
                    autoFocus
                    type="text"
                    value={formData.name}
                    onChange={setField('name')}
                    placeholder="e.g. Marina Tower Launch"
                    className={INPUT}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="proj-description">Description</FieldLabel>
                  <textarea
                    id="proj-description"
                    rows={3}
                    value={formData.description}
                    onChange={setField('description')}
                    placeholder="Short summary of the project…"
                    className={`${INPUT} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    id="proj-status"
                    label="Status"
                    value={formData.status}
                    onChange={setField('status')}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </SelectField>

                  <div>
                    <FieldLabel htmlFor="proj-budget" icon={Wallet}>Budget ($)</FieldLabel>
                    <input
                      id="proj-budget"
                      type="number"
                      step="any"
                      min="0"
                      inputMode="decimal"
                      value={formData.budget}
                      onChange={setField('budget')}
                      placeholder="0"
                      className={`${INPUT} tabular-nums`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="proj-start" icon={Calendar}>Start date</FieldLabel>
                    <input
                      id="proj-start"
                      type="date"
                      value={formData.start_date}
                      max={formData.end_date || undefined}
                      onChange={setField('start_date')}
                      className={`${INPUT} tabular-nums`}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="proj-end" icon={Calendar}>End date</FieldLabel>
                    <input
                      id="proj-end"
                      type="date"
                      value={formData.end_date}
                      min={formData.start_date || undefined}
                      onChange={setField('end_date')}
                      className={`${INPUT} tabular-nums`}
                    />
                  </div>
                </div>
              </div>

              {/* Footer (always visible) */}
              <div className="shrink-0 border-t border-zinc-200/70 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900"
                >
                  {submitting ? 'Saving...' : 'Save project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
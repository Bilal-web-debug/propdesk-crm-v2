import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, X, Pencil, Trash2, Target, User, Building2, Flag, ChevronDown, SearchX,
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

const LABEL = 'mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300'

const TH =
  'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'

const ICON_BTN =
  'rounded-lg p-2 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400'

const EMPTY_FORM = { customer_id: '', property_id: '', status: 'new', priority: 'medium', notes: '' }

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow up' },
  { value: 'closed_won', label: 'Closed won' },
  { value: 'closed_lost', label: 'Closed lost' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const FILTER_OPTIONS = [{ value: 'all', label: 'All' }, ...STATUS_OPTIONS]

const STATUS_STYLES = {
  new: {
    badge: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
    dot: 'bg-blue-500',
  },
  contacted: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
  },
  follow_up: {
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20',
    dot: 'bg-violet-500',
  },
  closed_won: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
    dot: 'bg-emerald-500',
  },
  closed_lost: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20',
    dot: 'bg-rose-500',
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

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
]

const statusLabel = (status) =>
  STATUS_OPTIONS.find((o) => o.value === status)?.label ?? (status ? String(status).replace(/_/g, ' ') : 'Unknown')

const priorityLabel = (priority) =>
  PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? 'Low'

function avatarGradient(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?'

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
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {priorityLabel(priority)}
    </span>
  )
}

function Avatar({ name, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-sm ${avatarGradient(name)} ${className}`}
    >
      {initials(name)}
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
        aria-label={`Edit lead for ${name}`}
        className={`${ICON_BTN} hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400`}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete lead for ${name}`}
        className={`${ICON_BTN} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function SelectField({ id, label, icon: Icon, optional = false, children, ...props }) {
  return (
    <div>
      <label htmlFor={id} className={`${LABEL} flex items-center gap-1.5`}>
        {Icon && <Icon size={13} className="text-zinc-400" aria-hidden="true" />}
        {label}
        {optional && <span className="font-normal text-zinc-400">(optional)</span>}
      </label>
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
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800" aria-busy="true" aria-label="Loading leads">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 p-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
          <div className="hidden h-5 w-20 rounded-full bg-zinc-100 sm:block dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasAnyLeads, showClear, onClear }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        {hasAnyLeads ? <SearchX size={22} /> : <Target size={22} />}
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {hasAnyLeads ? 'No leads match your filters' : 'No leads yet'}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {hasAnyLeads
          ? 'Try a different search term or stage.'
          : 'Add your first lead to start building your pipeline.'}
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
export default function Leads() {
  const [leads, setLeads] = useState([])
  const [customers, setCustomers] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  /* ---------- Data ---------- */
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          customers (full_name),
          properties (title)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDropdownData = useCallback(async () => {
    try {
      const [custRes, propRes] = await Promise.all([
        supabase.from('customers').select('id, full_name'),
        supabase.from('properties').select('id, title'),
      ])
      if (custRes.error) throw custRes.error
      if (propRes.error) throw propRes.error
      setCustomers(custRes.data || [])
      setProperties(propRes.data || [])
    } catch (error) {
      toast.error(error.message)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchDropdownData()
  }, [fetchLeads, fetchDropdownData])

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
  function openModal(lead = null) {
    if (lead) {
      setEditingId(lead.id)
      setFormData({
        customer_id: lead.customer_id || '',
        property_id: lead.property_id || '',
        status: lead.status || 'new',
        priority: lead.priority || 'medium',
        notes: lead.notes || '',
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
        customer_id: formData.customer_id || null,
        property_id: formData.property_id || null,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes,
      }

      if (editingId) {
        const { error } = await supabase.from('leads').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('leads').insert([payload])
        if (error) throw error
      }

      setIsModalOpen(false)
      toast.success(editingId ? 'Lead updated' : 'Lead added')
      fetchLeads()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- Delete ---------- */
  async function handleDelete(id) {
    if (!window.confirm('Delete this lead?')) return
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
      toast.success('Lead deleted')
      fetchLeads()
    } catch (error) {
      toast.error(error.message)
    }
  }

  /* ---------- Derived: filtering & counts ---------- */
  const filteredLeads = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false
      if (!q) return true
      return [lead.customers?.full_name, lead.properties?.title, lead.notes].some((field) =>
        String(field ?? '').toLowerCase().includes(q)
      )
    })
  }, [leads, searchTerm, statusFilter])

  const statusCounts = useMemo(() => {
    const counts = { all: leads.length }
    STATUS_OPTIONS.forEach((o) => { counts[o.value] = 0 })
    leads.forEach((l) => {
      if (l.status && l.status in counts && l.status !== 'all') counts[l.status]++
    })
    return counts
  }, [leads])

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
            Pipeline
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl dark:text-white">
            Leads
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{leads.length}</span> total
            {hasActiveFilters && (
              <>
                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{filteredLeads.length}</span> shown
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
          Add Lead
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
              placeholder="Search customer, property, or notes..."
            />
          </div>

          <div
            role="group"
            aria-label="Filter by stage"
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
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            hasAnyLeads={leads.length > 0}
            showClear={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
              {filteredLeads.map((lead) => {
                const name = lead.customers?.full_name || 'Unknown customer'
                return (
                  <li key={lead.id} className="flex gap-3.5 p-4">
                    <Avatar name={name} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{name}</p>
                        <RowActions
                          name={name}
                          onEdit={() => openModal(lead)}
                          onDelete={() => handleDelete(lead.id)}
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <StatusBadge status={lead.status} />
                        <PriorityBadge priority={lead.priority} />
                      </div>
                      {lead.properties?.title && (
                        <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
                          <Building2 size={13} className="shrink-0 opacity-70" aria-hidden="true" />
                          <span className="truncate">{lead.properties.title}</span>
                        </p>
                      )}
                      {lead.notes && (
                        <p className="mt-1.5 line-clamp-2 text-[13px] text-zinc-500 dark:text-zinc-400">
                          {lead.notes}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <th scope="col" className={`${TH} pl-5`}>Customer</th>
                    <th scope="col" className={TH}>Interested property</th>
                    <th scope="col" className={TH}>Status</th>
                    <th scope="col" className={TH}>Priority</th>
                    <th scope="col" className={`${TH} pr-5 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredLeads.map((lead) => {
                    const name = lead.customers?.full_name || 'Unknown customer'
                    return (
                      <tr key={lead.id} className="group transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30">
                        <td className="py-3 pl-5 pr-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={name} className="h-9 w-9" />
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-sm font-semibold text-zinc-900 dark:text-white" title={name}>
                                {name}
                              </p>
                              {lead.notes && (
                                <p className="max-w-[260px] truncate text-xs text-zinc-500 dark:text-zinc-400" title={lead.notes}>
                                  {lead.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {lead.properties?.title ? (
                            <span className="inline-flex max-w-[240px] items-center gap-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
                              <Building2 size={13} className="shrink-0 opacity-60" aria-hidden="true" />
                              <span className="truncate" title={lead.properties.title}>{lead.properties.title}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={lead.status} />
                        </td>

                        <td className="px-4 py-3">
                          <PriorityBadge priority={lead.priority} />
                        </td>

                        <td className="py-3 pl-4 pr-5">
                          <div className="opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                            <RowActions
                              name={name}
                              onEdit={() => openModal(lead)}
                              onDelete={() => handleDelete(lead.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
            aria-labelledby="lead-modal-title"
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200/70 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800">
              <div className="min-w-0">
                <h2 id="lead-modal-title" className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {editingId ? 'Edit lead' : 'Add lead'}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {editingId ? 'Update the lead details below.' : 'Link a customer to a property opportunity.'}
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
                  <SelectField
                    id="lead-customer"
                    label="Customer"
                    icon={User}
                    required
                    autoFocus
                    value={formData.customer_id}
                    onChange={setField('customer_id')}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </SelectField>
                  {customers.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                      No customers yet. Add one on the Customers page first.
                    </p>
                  )}
                </div>

                <SelectField
                  id="lead-property"
                  label="Interested property"
                  icon={Building2}
                  optional
                  value={formData.property_id}
                  onChange={setField('property_id')}
                >
                  <option value="">No property selected</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </SelectField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    id="lead-status"
                    label="Status"
                    value={formData.status}
                    onChange={setField('status')}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </SelectField>

                  <SelectField
                    id="lead-priority"
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
                  <label htmlFor="lead-notes" className={`${LABEL} block`}>Notes</label>
                  <textarea
                    id="lead-notes"
                    rows={3}
                    value={formData.notes}
                    onChange={setField('notes')}
                    placeholder="Add context, next steps, or follow-up details…"
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
                  {submitting ? 'Saving...' : 'Save lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
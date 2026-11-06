import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Upload, Pencil, Trash2, Building2, SearchX, MapPin, ImageOff } from 'lucide-react'
import SearchFilter from '../components/SearchFilter'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

/* ============================================================
   STYLE TOKENS
   ============================================================ */
const CARD =
  'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-zinc-800/80 dark:bg-zinc-900'

const INPUT =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100'

const LABEL = 'mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300'

const ICON_BTN =
  'rounded-lg p-2 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400'

const EMPTY_FORM = { title: '', location: '', price: '', property_type: 'Apartment', status: 'available' }

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
  { value: 'pending', label: 'Pending' },
]

const FILTER_OPTIONS = [{ value: 'all', label: 'All' }, ...STATUS_OPTIONS]

const STATUS_STYLES = {
  available: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
    dot: 'bg-emerald-500',
  },
  sold: {
    badge: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-700/40 dark:text-zinc-300 dark:ring-zinc-500/30',
    dot: 'bg-zinc-400',
  },
  rented: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20',
    dot: 'bg-sky-500',
  },
  pending: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
  },
}
const DEFAULT_STATUS = {
  badge: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300',
  dot: 'bg-zinc-400',
}

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isNaN(n) ? '—' : `$${n.toLocaleString()}`
}

/* ============================================================
   PRESENTATIONAL HELPERS
   ============================================================ */
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || DEFAULT_STATUS
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status || 'unknown'}
    </span>
  )
}

function Thumb({ src, alt, className = '' }) {
  // Track the failing src itself, so a new image URL gets a fresh attempt
  const [failedSrc, setFailedSrc] = useState(null)
  const base = `${className} shrink-0 rounded-lg ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700`

  if (!src || failedSrc === src) {
    return (
      <div
        className={`${base} flex items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500`}
        aria-hidden="true"
      >
        {src ? <ImageOff size={16} /> : <Building2 size={16} />}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={`${base} object-cover`}
    />
  )
}

function RowActions({ name, canDelete, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${name}`}
        className={`${ICON_BTN} hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400`}
      >
        <Pencil size={15} />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          aria-label={`Delete ${name}`}
          className={`${ICON_BTN} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400`}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800" aria-busy="true" aria-label="Loading properties">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
          <div className="h-12 w-16 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasAnyProperties, onClear, showClear }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        {hasAnyProperties ? <SearchX size={22} /> : <Building2 size={22} />}
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {hasAnyProperties ? 'No properties match your search' : 'No properties yet'}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {hasAnyProperties ? 'Try adjusting your search or filter.' : 'Add your first property to get started.'}
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
export default function Properties() {
  const { role } = useAuth()

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [currentImageUrl, setCurrentImageUrl] = useState(null)

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  /* ---------- Data ---------- */
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  /* ---------- Image preview lifecycle ---------- */
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  /* ---------- Modal: Esc to close + scroll lock ---------- */
  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isModalOpen])

  /* ---------- Modal open ---------- */
  function openModal(property = null) {
    setImageFile(null)
    if (property) {
      setEditingId(property.id)
      setCurrentImageUrl(property.image_url || null)
      setFormData({
        title: property.title ?? '',
        location: property.location ?? '',
        price: property.price ?? '',
        property_type: property.property_type ?? 'Apartment',
        status: property.status ?? 'available',
      })
    } else {
      setEditingId(null)
      setCurrentImageUrl(null)
      setFormData(EMPTY_FORM)
    }
    setIsModalOpen(true)
  }

  /* ---------- Create / update ---------- */
  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSubmitting(true)
      let image_url = undefined

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, imageFile)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName)
        image_url = publicUrl
      }

      if (editingId) {
        const updateData = {
          title: formData.title,
          location: formData.location,
          price: parseFloat(formData.price),
          property_type: formData.property_type,
          status: formData.status,
        }
        if (image_url) updateData.image_url = image_url
        const { error } = await supabase.from('properties').update(updateData).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('properties').insert([{
          title: formData.title,
          location: formData.location,
          price: parseFloat(formData.price),
          property_type: formData.property_type,
          status: formData.status,
          image_url: image_url || null,
        }])
        if (error) throw error
      }

      setIsModalOpen(false)
      toast.success('Property saved successfully!')
      fetchProperties()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- Delete ---------- */
  async function handleDelete(id, title) {
    const confirmDelete = window.confirm(`Kya aap waqai "${title}" ko delete karna chahte hain?`)
    if (!confirmDelete) return

    try {
      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw error
      toast.success('Property deleted!')
      fetchProperties()
    } catch (error) {
      toast.error(error.message)
    }
  }

  /* ---------- Derived: filtering & counts ---------- */
  const filteredProperties = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return properties.filter((prop) => {
      const matchesSearch =
        !q ||
        prop.title?.toLowerCase().includes(q) ||
        prop.location?.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || prop.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [properties, searchTerm, statusFilter])

  const statusCounts = useMemo(() => {
    const counts = { all: properties.length }
    STATUS_OPTIONS.forEach((o) => { counts[o.value] = 0 })
    properties.forEach((p) => {
      if (p.status && p.status in counts && p.status !== 'all') counts[p.status]++
    })
    return counts
  }, [properties])

  const hasActiveFilters = Boolean(searchTerm.trim()) || statusFilter !== 'all'
  const clearFilters = () => { setSearchTerm(''); setStatusFilter('all') }

  const displayImage = previewUrl || currentImageUrl

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12 animate-fade-up">

      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
            Inventory
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl dark:text-white">
            Properties
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{properties.length}</span> total
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
            <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{filteredProperties.length}</span> shown
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          Add Property
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
              placeholder="Search by title or location..."
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
        ) : filteredProperties.length === 0 ? (
          <EmptyState
            hasAnyProperties={properties.length > 0}
            showClear={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
              {filteredProperties.map((prop) => (
                <li key={prop.id} className="flex gap-3.5 p-4">
                  <Thumb src={prop.image_url} alt={prop.title} className="h-16 w-20" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{prop.title}</p>
                      <StatusBadge status={prop.status} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      <MapPin size={11} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{prop.location}</span>
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
                        {formatPrice(prop.price)}
                      </span>
                      <RowActions
                        name={prop.title}
                        canDelete={role === 'admin'}
                        onEdit={() => openModal(prop)}
                        onDelete={() => handleDelete(prop.id, prop.title)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Image</th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Title</th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Location</th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Price</th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status</th>
                    <th scope="col" className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredProperties.map((prop) => (
                    <tr
                      key={prop.id}
                      className="group transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-5 py-3">
                        <Thumb src={prop.image_url} alt={prop.title} className="h-12 w-16" />
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white" title={prop.title}>
                          {prop.title}
                        </p>
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400" title={prop.location}>
                          {prop.location}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
                        {formatPrice(prop.price)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={prop.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <RowActions
                            name={prop.title}
                            canDelete={role === 'admin'}
                            onEdit={() => openModal(prop)}
                            onDelete={() => handleDelete(prop.id, prop.title)}
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
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-modal-title"
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200/70 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800">
              <div className="min-w-0">
                <h2 id="property-modal-title" className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {editingId ? 'Edit property' : 'Add new property'}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {editingId ? 'Update the details below.' : 'Fill in the details to list a new property.'}
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
                  <label htmlFor="prop-title" className={LABEL}>Property title</label>
                  <input
                    id="prop-title"
                    required
                    autoFocus
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Sunset Villa"
                    className={INPUT}
                  />
                </div>

                <div>
                  <label htmlFor="prop-location" className={LABEL}>Location</label>
                  <input
                    id="prop-location"
                    required
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Dubai Marina"
                    className={INPUT}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="prop-price" className={LABEL}>Price ($)</label>
                    <input
                      id="prop-price"
                      required
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={formData.price}
                      onChange={(e) => setFormData((f) => ({ ...f, price: e.target.value }))}
                      placeholder="0"
                      className={`${INPUT} tabular-nums`}
                    />
                  </div>
                  <div>
                    <label htmlFor="prop-status" className={LABEL}>Status</label>
                    <select
                      id="prop-status"
                      value={formData.status}
                      onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}
                      className={INPUT}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className={LABEL}>Property image</span>
                  <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/40 transition-colors hover:border-indigo-400 hover:bg-indigo-50/30 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/30 dark:hover:border-indigo-500/60 dark:hover:bg-indigo-500/5">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt="Property preview"
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-32 flex-col items-center justify-center gap-1.5 px-4 text-center">
                        <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm dark:bg-zinc-800 dark:text-zinc-500">
                          <Upload size={16} aria-hidden="true" />
                        </span>
                        <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Click to upload an image</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">PNG, JPG or WebP</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      aria-label="Upload property image"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                  <p className="mt-1.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {imageFile
                      ? imageFile.name
                      : currentImageUrl
                        ? 'Click the image to replace it'
                        : 'Optional'}
                  </p>
                </div>
              </div>

              {/* Footer (always visible) */}
              <div className="shrink-0 border-t border-zinc-200/70 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update property' : 'Save property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
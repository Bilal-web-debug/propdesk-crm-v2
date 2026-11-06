import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Pencil, Trash2, Mail, Phone, Users, SearchX } from 'lucide-react'

/* ---------- avatar helper (presentational only) ---------- */
const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
]
function avatarGradient(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}
const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', requirements: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  function openModal(customer = null) {
    if (customer) {
      setEditingId(customer.id)
      setFormData({
        full_name: customer.full_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        requirements: customer.requirements || ''
      })
    } else {
      setEditingId(null)
      setFormData({ full_name: '', email: '', phone: '', requirements: '' })
    }
    setIsModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSubmitting(true)

      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        requirements: formData.requirements
      }

      if (editingId) {
        const { error } = await supabase.from('customers').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('customers').insert([payload])
        if (error) throw error
      }

      setIsModalOpen(false)
      fetchCustomers()
    } catch (error) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete customer "${name}"?`)) return
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      fetchCustomers()
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 pb-10 animate-fade-up">

      {/* ---------- Header ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Contacts
          </p>
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
            Customers
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            <span className="tabular font-medium text-zinc-700 dark:text-zinc-300">{customers.length}</span> total
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-500/20 transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} /> Add Customer
        </button>
      </div>

      {/* ---------- Table Card ---------- */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 shadow-card overflow-hidden">

        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4">
              <Users size={22} />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No customers yet</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Add your first customer to start tracking relationships.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/70 dark:border-zinc-800">
                  {['Name', 'Contact', 'Requirements'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {customers.map((c) => (
                  <tr key={c.id} className="group hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">

                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(c.full_name)} flex items-center justify-center text-white font-semibold text-xs shadow-sm flex-shrink-0`}>
                          {initials(c.full_name)}
                        </div>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[200px]">
                          {c.full_name || 'Unnamed'}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-[13px]">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[240px]"
                          >
                            <Mail size={13} className="flex-shrink-0 opacity-70" />
                            <span className="truncate">{c.email}</span>
                          </a>
                        ) : null}
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors tabular"
                          >
                            <Phone size={13} className="flex-shrink-0 opacity-70" />
                            <span>{c.phone}</span>
                          </a>
                        ) : null}
                        {!c.email && !c.phone && (
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs">No contact info</span>
                        )}
                      </div>
                    </td>

                    {/* Requirements */}
                    <td className="px-4 py-3">
                      {c.requirements ? (
                        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 max-w-xs truncate" title={c.requirements}>
                          {c.requirements}
                        </p>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(c)}
                          className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.full_name)}
                          className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Add/Edit Modal ---------- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-zinc-950/20 w-full max-w-md border border-zinc-200/70 dark:border-zinc-800 max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-start gap-3 p-5 border-b border-zinc-200/70 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {editingId ? 'Edit Customer' : 'Add Customer'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {editingId ? 'Update customer details below.' : 'Enter contact information.'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <input
                  required type="text" value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100
                             placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="e.g. Ali Khan"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100
                             placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Phone
                </label>
                <input
                  required type="text" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100
                             placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular"
                  placeholder="+92 300 1234567"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Requirements
                </label>
                <textarea
                  rows="3" value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100
                             placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="e.g. Looking for 3 bed house in DHA"
                />
              </div>

              <div className="pt-2">
                <button
                  disabled={submitting} type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium py-2.5 rounded-xl shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
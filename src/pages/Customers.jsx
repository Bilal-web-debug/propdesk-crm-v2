import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Pencil, Trash2, Mail, Phone } from 'lucide-react'

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No customers yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Requirements</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{c.full_name}</td>
                  <td className="p-4 text-sm text-gray-600">
                    <div className="flex flex-col gap-1">
                      {c.email && <span className="flex items-center gap-1"><Mail size={14}/> {c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1"><Phone size={14}/> {c.phone}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{c.requirements || '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(c.id, c.full_name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea rows="3" value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="e.g. Looking for 3 bed house in DHA"></textarea>
              </div>
              
              <div className="pt-2">
                <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
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
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Pencil, Trash2, Target } from 'lucide-react'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [customers, setCustomers] = useState([])
  const [properties, setProperties] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    customer_id: '', property_id: '', status: 'new', priority: 'medium', notes: ''
  })

  useEffect(() => {
    fetchLeads()
    fetchDropdownData()
  }, [])

  async function fetchLeads() {
    try {
      setLoading(true)
      // Hum joined query kar rahe hain taake Customer aur Property ka naam bhi aaye
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
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDropdownData() {
    // Fetch customers and properties for the dropdowns
    const { data: custData } = await supabase.from('customers').select('id, full_name')
    const { data: propData } = await supabase.from('properties').select('id, title')
    
    setCustomers(custData || [])
    setProperties(propData || [])
  }

  function openModal(lead = null) {
    if (lead) {
      setEditingId(lead.id)
      setFormData({
        customer_id: lead.customer_id || '',
        property_id: lead.property_id || '',
        status: lead.status || 'new',
        priority: lead.priority || 'medium',
        notes: lead.notes || ''
      })
    } else {
      setEditingId(null)
      setFormData({ customer_id: '', property_id: '', status: 'new', priority: 'medium', notes: '' })
    }
    setIsModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSubmitting(true)
      
      const payload = {
        customer_id: formData.customer_id || null,
        property_id: formData.property_id || null,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes
      }

      if (editingId) {
        const { error } = await supabase.from('leads').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('leads').insert([payload])
        if (error) throw error
      }
      
      setIsModalOpen(false)
      fetchLeads()
    } catch (error) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this lead?")) return
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
      fetchLeads()
    } catch (error) {
      alert(error.message)
    }
  }

  // Status badge color helper
  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'contacted': return 'bg-yellow-100 text-yellow-700'
      case 'follow_up': return 'bg-purple-100 text-purple-700'
      case 'closed_won': return 'bg-green-100 text-green-700'
      case 'closed_lost': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Add Lead
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Target className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No leads yet</h3>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                <th className="p-4">Customer</th>
                <th className="p-4">Interested Property</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    {lead.customers?.full_name || 'Unknown Customer'}
                  </td>
                  <td className="p-4 text-gray-600">
                    {lead.properties?.title || 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(lead.status)}`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-sm text-gray-600">{lead.priority}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(lead)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Lead' : 'Add Lead'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select required value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interested Property</label>
                <select value={formData.property_id} onChange={(e) => setFormData({...formData, property_id: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select Property (Optional)</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-md"></textarea>
              </div>
              
              <div className="pt-2">
                <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
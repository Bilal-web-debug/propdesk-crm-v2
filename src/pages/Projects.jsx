import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Pencil, Trash2, FolderKanban } from 'lucide-react'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '', description: '', status: 'planning', start_date: '', end_date: '', budget: ''
  })

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProjects(data || [])
    } catch (error) { alert(error.message) } finally { setLoading(false) }
  }

  function openModal(project = null) {
    if (project) {
      setEditingId(project.id)
      setFormData({
        name: project.name, description: project.description || '', 
        status: project.status, start_date: project.start_date || '', 
        end_date: project.end_date || '', budget: project.budget || ''
      })
    } else {
      setEditingId(null)
      setFormData({ name: '', description: '', status: 'planning', start_date: '', end_date: '', budget: '' })
    }
    setIsModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = {
        name: formData.name, description: formData.description, status: formData.status,
        start_date: formData.start_date || null, end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null
      }

      if (editingId) {
        const { error } = await supabase.from('projects').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('projects').insert([payload])
        if (error) throw error
      }
      setIsModalOpen(false)
      fetchProjects()
    } catch (error) { alert(error.message) } finally { setSubmitting(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this project? All associated tasks will also be deleted.")) return
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      fetchProjects()
    } catch (error) { alert(error.message) }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'planning': return 'bg-gray-100 text-gray-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'on_hold': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Add Project
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <FolderKanban className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                <th className="p-4">Project Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Timeline</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    {p.name}
                    <div className="text-xs text-gray-500 font-normal mt-1 truncate max-w-xs">{p.description}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(p.status)}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-gray-900">${p.budget?.toLocaleString() || '0'}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {p.start_date ? new Date(p.start_date).toLocaleDateString() : '?'} - {p.end_date ? new Date(p.end_date).toLocaleDateString() : '?'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Project' : 'Add Project'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-md"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                  <input type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              
              <div className="pt-2">
                <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
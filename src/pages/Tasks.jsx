import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Pencil, Trash2, CheckSquare } from 'lucide-react'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    project_id: '', title: '', description: '', status: 'todo', priority: 'medium', due_date: ''
  })

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [])

  async function fetchTasks() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, projects (name)`)
        .order('created_at', { ascending: false })
      if (error) throw error
      setTasks(data || [])
    } catch (error) { alert(error.message) } finally { setLoading(false) }
  }

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('id, name')
    setProjects(data || [])
  }

  function openModal(task = null) {
    if (task) {
      setEditingId(task.id)
      setFormData({
        project_id: task.project_id || '', title: task.title, description: task.description || '',
        status: task.status, priority: task.priority, due_date: task.due_date || ''
      })
    } else {
      setEditingId(null)
      setFormData({ project_id: '', title: '', description: '', status: 'todo', priority: 'medium', due_date: '' })
    }
    setIsModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = {
        project_id: formData.project_id || null, title: formData.title, description: formData.description,
        status: formData.status, priority: formData.priority, due_date: formData.due_date || null
      }

      if (editingId) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tasks').insert([payload])
        if (error) throw error
      }
      setIsModalOpen(false)
      fetchTasks()
    } catch (error) { alert(error.message) } finally { setSubmitting(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this task?")) return
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      fetchTasks()
    } catch (error) { alert(error.message) }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'todo': return 'bg-gray-100 text-gray-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'review': return 'bg-yellow-100 text-yellow-700'
      case 'done': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Add Task
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                <th className="p-4">Task</th>
                <th className="p-4">Project</th>
                <th className="p-4">Status</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{t.title}</td>
                  <td className="p-4 text-gray-600">{t.projects?.name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(t.status)}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Task' : 'Add Task'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-md"></textarea>
              </div>
              
              <div className="pt-2">
                <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
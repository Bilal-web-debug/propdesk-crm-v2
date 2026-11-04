import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Upload, Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import SearchFilter from '../components/SearchFilter'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const { role } = useAuth()



  // 🔍 Search & Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formData, setFormData] = useState({
    title: '', location: '', price: '', property_type: 'Apartment', status: 'available'
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
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
  }

  function openModal(property = null) {
    if (property) {
      setEditingId(property.id)
      setFormData({
        title: property.title,
        location: property.location,
        price: property.price,
        property_type: property.property_type,
        status: property.status,
      })
      setImageFile(null)
    } else {
      setEditingId(null)
      setFormData({ title: '', location: '', price: '', property_type: 'Apartment', status: 'available' })
      setImageFile(null)
    }
    setIsModalOpen(true)
  }

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
      toast.success('Property saved successfully!') // Yeh line add karein
      fetchProperties()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, title) {
    const confirmDelete = window.confirm(`Kya aap waqai "${title}" ko delete karna chahte hain?`)
    if (!confirmDelete) return

    try {
      const { error } = await supabase.from('properties').delete().eq('id', id)
      toast.success('Property deleted!') // Yeh line add karein
      if (error) throw error
      fetchProperties()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // 🔍 Filter logic
  const filteredProperties = properties.filter((prop) => {
    const matchesSearch =
      prop.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || prop.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Properties</h2>
          <p className="text-sm text-gray-500 mt-1">
            {properties.length} total · {filteredProperties.length} shown
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} /> Add Property
        </button>
      </div>

      {/* 🔍 Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <SearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search by title or location..."
        />

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white 
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                       transition-all"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-2">
              {properties.length === 0
                ? 'No properties yet.'
                : 'No properties match your search.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all') }}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                <th className="p-4">Image</th>
                <th className="p-4">Title</th>
                <th className="p-4">Location</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((prop) => (
                <tr key={prop.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    {prop.image_url ? (
                      <img
                        src={prop.image_url}
                        alt={prop.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        No Img
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-900">{prop.title}</td>
                  <td className="p-4 text-gray-600">{prop.location}</td>
                  <td className="p-4 text-gray-900 font-medium">
                    ${prop.price?.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 capitalize">
                      {prop.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openModal(prop)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      {role === 'admin' && (
  <button onClick={() => handleDelete(prop.id, prop.title)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
    <Trash2 size={16} />
  </button>
)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal — unchanged */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Property' : 'Add New Property'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
                <input
                  required type="text" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  required type="text" value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  required type="number" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative">
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {imageFile ? imageFile.name : 'Click to upload new image'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={submitting} type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Property' : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
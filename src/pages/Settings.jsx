import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { User, Phone, Mail, Shield } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    role: ''
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          role: data.role || 'agent'
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function updateProfile(e) {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Check if profile exists, if not insert, else update
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single()
      
      if (existing) {
        const { error } = await supabase.from('profiles').update({
          full_name: profile.full_name,
          phone: profile.phone
        }).eq('id', user.id)
        if (error) throw error
      } else {
     const { error } = await supabase.from('profiles').insert([{
  id: user.id,
  full_name: profile.full_name,
  phone: profile.phone,
  role: 'admin' // <--- Hardcode kar ke 'admin' kar dein
}])
        if (error) throw error
      }

      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
            {profile.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{profile.full_name || 'User Name'}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1"><Mail size={14}/> {user?.email}</p>
          </div>
        </div>

        <form onSubmit={updateProfile} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={profile.full_name} 
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})} 
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone size={18} />
                </div>
                <input 
                  type="text" 
                  value={profile.phone} 
                  onChange={(e) => setProfile({...profile, phone: e.target.value})} 
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Shield size={18} />
              </div>
              <input 
                type="text" 
                value={profile.role} 
                disabled
                className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed capitalize" 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Role can only be changed by an administrator.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              disabled={loading} 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user role from profiles table
  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile row might not exist yet (e.g. right after signup)
        // Don't crash — just log and leave role as null
        console.warn('[AuthContext] Could not fetch role:', error.message)
        setRole(null)
        return
      }

      setRole(data?.role ?? null)
    } catch (err) {
      console.error('[AuthContext] fetchRole error:', err)
      setRole(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    // 1. Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchRole(currentUser.id)
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    // 2. Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          fetchRole(currentUser.id)
        } else {
          setRole(null)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  // Login function
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // Register function
  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName } // Saved in user metadata
      }
    })
    if (error) throw error
    return data
  }

  // Logout function
  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setRole(null) // Clear role on logout
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext)
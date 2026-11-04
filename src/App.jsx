import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties' // ✅ Import Properties
import DashboardLayout from './layouts/DashboardLayout'
import { useAuth } from './context/AuthContext'
import Customers from './pages/Customers'
import Leads from './pages/Leads'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import { Toaster } from 'react-hot-toast'
import Settings from './pages/Settings'
import Reports from './pages/Reports'



function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
    <Toaster position="top-right" toastOptions={{ 
  style: { background: '#333', color: '#fff' }, 
  success: { duration: 3000 } 
}} />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        
        {/* Dashboard Layout Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } 
        >
          {/* Index route (Dashboard default page) */}
          <Route index element={<Dashboard />} />
          
          {/* ✅ Properties Route - Nested inside DashboardLayout */}
          <Route path="properties" element={<Properties />} />
          <Route path="customers" element={<Customers />} />
          <Route path="leads" element={<Leads />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<Reports />} />
          
          {/* Future routes can be added here:
          <Route path="leads" element={<Leads />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="settings" element={<Settings />} />
          */}
        </Route>

        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}
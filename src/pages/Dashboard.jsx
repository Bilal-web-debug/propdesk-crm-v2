import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Building2, Users, Target, FolderKanban } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// Dummy data (baad mein DB se link kar sakte hain)
const chartData = [
  { name: 'Jan', properties: 4, leads: 10 },
  { name: 'Feb', properties: 7, leads: 15 },
  { name: 'Mar', properties: 5, leads: 25 },
  { name: 'Apr', properties: 12, leads: 30 },
  { name: 'May', properties: 18, leads: 45 },
  { name: 'Jun', properties: 22, leads: 60 },
]

// Custom tooltip for a premium look
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-gray-600">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.dataKey}:</span>
          <span className="font-medium text-gray-900">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    properties: 0,
    customers: 0,
    leads: 0,
    projects: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      const [propRes, custRes, leadRes, projRes] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      ])

      setStats({
        properties: propRes.count || 0,
        customers: custRes.count || 0,
        leads: leadRes.count || 0,
        projects: projRes.count || 0,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Properties', value: stats.properties, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Customers', value: stats.customers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Active Leads', value: stats.leads, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Ongoing Projects', value: stats.projects, icon: FolderKanban, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="text-gray-500">Loading statistics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 📊 Area Chart */}
      <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sales & Leads Overview</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Monthly trend of new properties and leads
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorProperties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />

              <Area
                type="monotone"
                dataKey="properties"
                name="Properties"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProperties)"
              />
              <Area
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeads)"   // ✅ FIXED (pehle "#colorLeads" tha)
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome to PropDesk CRM</h3>
        <p className="text-gray-600">
          Use the sidebar on the left to manage your properties, customers, leads,
          projects, and tasks. The statistics above will update automatically as you
          add data.
        </p>
      </div>
    </div>
  )
}
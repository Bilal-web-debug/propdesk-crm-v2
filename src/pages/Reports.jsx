import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, Download, Building2, Users, Target } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

export default function Reports() {
  const [downloading, setDownloading] = useState(false)

  // Properties ka PDF generate karna
  const generatePropertiesPDF = async () => {
    try {
      setDownloading(true)
      const { data, error } = await supabase.from('properties').select('*')
      if (error) throw error

      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(18)
      doc.setTextColor(40)
      doc.text('PropDesk CRM - Property Report', 14, 22)
      
      // Date
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

      // Table Data
      const tableColumn = ["Title", "Location", "Type", "Price ($)", "Status"]
      const tableRows = data.map(prop => [
        prop.title,
        prop.location,
        prop.property_type || '-',
        prop.price ? prop.price.toLocaleString() : '0',
        prop.status.toUpperCase()
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 36,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // Blue color
        styles: { fontSize: 9 }
      })

      doc.save('Properties_Report.pdf')
      toast.success('PDF Downloaded Successfully!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDownloading(false)
    }
  }

  // Leads ka PDF generate karna
  const generateLeadsPDF = async () => {
    try {
      setDownloading(true)
      const { data, error } = await supabase.from('leads').select(`*, customers (full_name)`)
      if (error) throw error

      const doc = new jsPDF()
      
      doc.setFontSize(18)
      doc.setTextColor(40)
      doc.text('PropDesk CRM - Leads Report', 14, 22)
      
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

      const tableColumn = ["Customer Name", "Status", "Priority", "Notes"]
      const tableRows = data.map(lead => [
        lead.customers?.full_name || 'N/A',
        lead.status.replace('_', ' ').toUpperCase(),
        lead.priority.toUpperCase(),
        lead.notes || '-'
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 36,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] }, // Purple color
        styles: { fontSize: 9 }
      })

      doc.save('Leads_Report.pdf')
      toast.success('PDF Downloaded Successfully!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reports & Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Properties Report Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Properties Report</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Export all property listings to PDF</p>
            </div>
          </div>
          <button 
            onClick={generatePropertiesPDF}
            disabled={downloading}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Download size={18} /> 
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>

        {/* Leads Report Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Leads Report</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Export sales leads to PDF</p>
            </div>
          </div>
          <button 
            onClick={generateLeadsPDF}
            disabled={downloading}
            className="w-full flex justify-center items-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            <Download size={18} /> 
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>

      </div>
    </div>
  )
}
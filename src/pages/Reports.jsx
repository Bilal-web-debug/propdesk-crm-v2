import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Download, Building2, Target, FileText, Loader2, FileDown, CheckCircle2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

/* ============================================================
   STYLE TOKENS
   ============================================================ */
const CARD =
  'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-zinc-800/80 dark:bg-zinc-900'

/* ============================================================
   REPORT CONFIG
   Each report owns its query, PDF columns, and row mapping.
   ============================================================ */
const REPORTS = [
  {
    key: 'properties',
    title: 'Properties report',
    description: 'Export every property listing as a formatted PDF.',
    fileName: 'Properties_Report.pdf',
    pdfTitle: 'PropDesk CRM - Property Report',
    headColor: [59, 130, 246], // blue
    icon: Building2,
    includes: ['Title', 'Location', 'Type', 'Price', 'Status'],
    accent: 'from-blue-500 to-cyan-500',
    tone: {
      icon: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      button:
        'bg-blue-600 shadow-blue-500/20 hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500',
    },
    query: () => supabase.from('properties').select('*'),
    columns: ['Title', 'Location', 'Type', 'Price ($)', 'Status'],
    toRow: (prop) => [
      prop.title,
      prop.location,
      prop.property_type || '-',
      prop.price ? prop.price.toLocaleString() : '0',
      prop.status ? prop.status.toUpperCase() : '-',
    ],
  },
  {
    key: 'leads',
    title: 'Leads report',
    description: 'Export your sales pipeline, with customers and notes, as a PDF.',
    fileName: 'Leads_Report.pdf',
    pdfTitle: 'PropDesk CRM - Leads Report',
    headColor: [139, 92, 246], // purple
    icon: Target,
    includes: ['Customer', 'Status', 'Priority', 'Notes'],
    accent: 'from-violet-500 to-purple-600',
    tone: {
      icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
      button:
        'bg-violet-600 shadow-violet-500/20 hover:bg-violet-700 active:bg-violet-800 focus-visible:ring-violet-500',
    },
    query: () => supabase.from('leads').select(`*, customers (full_name)`),
    columns: ['Customer Name', 'Status', 'Priority', 'Notes'],
    toRow: (lead) => [
      lead.customers?.full_name || 'N/A',
      lead.status ? lead.status.replace(/_/g, ' ').toUpperCase() : '-',
      lead.priority ? lead.priority.toUpperCase() : '-',
      lead.notes || '-',
    ],
  },
]

/* ============================================================
   PDF BUILDER
   ============================================================ */
function buildPdf({ title, columns, rows, headColor }) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.setTextColor(40)
  doc.text(title, 14, 22)

  // Timestamp
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

  // Table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 36,
    theme: 'grid',
    headStyles: { fillColor: headColor },
    styles: { fontSize: 9 },
  })

  return doc
}

/* ============================================================
   PRESENTATIONAL HELPERS
   ============================================================ */
function IncludesList({ items }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

function ReportCard({ report, generating, lastExported, onExport }) {
  const Icon = report.icon
  const isThisGenerating = generating === report.key
  const anyGenerating = generating !== null

  return (
    <article className={`group relative overflow-hidden ${CARD} transition-shadow duration-200 hover:shadow-md`}>
      {/* Accent line */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${report.accent} opacity-60 transition-opacity duration-200 group-hover:opacity-100`}
      />

      <div className="flex h-full flex-col gap-5 p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${report.tone.icon}`}>
            <Icon size={20} strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white">
              {report.title}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {report.description}
            </p>
          </div>
          <FileDown
            size={16}
            aria-hidden="true"
            className="mt-1 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400"
          />
        </div>

        {/* Columns */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Includes
          </p>
          <IncludesList items={report.includes} />
        </div>

        {/* Footer */}
        <div className="mt-auto space-y-4 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {lastExported ? (
              <>
                <CheckCircle2 size={13} className="shrink-0 text-emerald-500" aria-hidden="true" />
                Exported at {lastExported} this session
              </>
            ) : (
              'Not exported this session'
            )}
          </p>

          <button
            type="button"
            onClick={() => onExport(report)}
            disabled={anyGenerating}
            aria-busy={isThisGenerating}
            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 ${report.tone.button}`}
          >
            {isThisGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Generating…
              </>
            ) : (
              <>
                <Download size={16} aria-hidden="true" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

/* ============================================================
   MAIN
   ============================================================ */
export default function Reports() {
  const [generating, setGenerating] = useState(null) // report key or null
  const [lastExported, setLastExported] = useState({}) // { [key]: 'h:mm AM' }

  async function runExport(report) {
    setGenerating(report.key)
    try {
      const { data, error } = await report.query()
      if (error) throw error

      const rows = (data || []).map(report.toRow)
      const doc = buildPdf({
        title: report.pdfTitle,
        columns: report.columns,
        rows,
        headColor: report.headColor,
      })
      doc.save(report.fileName)

      setLastExported((prev) => ({
        ...prev,
        [report.key]: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      }))
      toast.success('PDF Downloaded Successfully!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12 animate-fade-up">

      {/* ---------- Header ---------- */}
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
          Output
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl dark:text-white">
          Reports &amp; Analytics
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Export your data as formatted PDF reports.
        </p>
      </header>

      {/* ---------- Report cards ---------- */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {REPORTS.map((report) => (
          <ReportCard
            key={report.key}
            report={report}
            generating={generating}
            lastExported={lastExported[report.key]}
            onExport={runExport}
          />
        ))}
      </div>

      {/* ---------- Info strip ---------- */}
      <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200/70 bg-white/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <FileText size={15} className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
        <p className="text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Reports are built in your browser from live data and saved as{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">.pdf</span> files. Each export includes a
          generated timestamp and a formatted table.
        </p>
      </div>
    </div>
  )
}
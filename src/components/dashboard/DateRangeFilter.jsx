import { useState } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'

const OPTIONS = [
  { value: 3,  label: 'Last 3 months' },
  { value: 6,  label: 'Last 6 months' },
  { value: 12, label: 'Last 12 months' },
]

export default function DateRangeFilter({ months, onChange }) {
  const [open, setOpen] = useState(false)
  const current = OPTIONS.find(o => o.value === months) || OPTIONS[1]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="group inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all"
      >
        <Calendar size={14} className="text-zinc-400" />
        {current.label}
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-44 z-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-card-hover py-1 animate-scale-in">
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  months === opt.value
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
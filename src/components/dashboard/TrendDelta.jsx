import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

/**
 * Shows percentage change from `previous` to `current`.
 * Handles prev=0 and current=0 gracefully.
 */
export default function TrendDelta({ current = 0, previous = 0, compact = false }) {
  let pct = null
  let direction = 'flat'

  if (previous > 0) {
    pct = ((current - previous) / previous) * 100
    if (Math.abs(pct) < 0.5) direction = 'flat'
    else direction = pct > 0 ? 'up' : 'down'
  } else if (current > 0) {
    direction = 'up'
    pct = 100 // from 0 → anything is "new", display as +100%
  } else {
    direction = 'flat'
  }

  if (direction === 'flat') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
        <Minus size={11} />
        {!compact && 'No change'}
      </span>
    )
  }

  const isUp = direction === 'up'
  const Icon = isUp ? ArrowUpRight : ArrowDownRight
  const color = isUp
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400'

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${color}`}>
      <Icon size={11} />
      {isUp ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}
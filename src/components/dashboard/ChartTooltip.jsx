import { motion } from 'framer-motion'

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 shadow-card-hover"
    >
      {label && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs py-0.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color || p.fill, boxShadow: `0 0 8px ${p.color || p.fill}` }}
          />
          <span className="text-zinc-500 dark:text-zinc-400 capitalize">{p.name}</span>
          <span className="ml-auto font-bold tabular text-zinc-900 dark:text-zinc-50">{p.value}</span>
        </div>
      ))}
    </motion.div>
  )
}
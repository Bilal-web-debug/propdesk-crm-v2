export default function LiveDot({ label = 'Live' }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <span className="relative flex h-2 w-2">
        <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        {label}
      </span>
    </span>
  )
}
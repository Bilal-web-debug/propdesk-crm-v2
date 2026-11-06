import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import AnimatedNumber from './AnimatedNumber'
import TrendDelta from './TrendDelta'

export default function StatCard({ config, index = 0 }) {
  const { title, value, icon: Icon, link, gradient, glow, tint, iconColor, ring, delta } = config

  return (
    <div
      className="animate-fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link
        to={link}
        className={`group relative block bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:scale-[1.015] ring-1 ring-transparent ${ring} transition-all duration-300 overflow-hidden ${glow}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`} />
        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradient} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500`} />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${tint} ${iconColor} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <Icon size={18} strokeWidth={2.2} />
            </div>
            <ArrowUpRight
              size={16}
              className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
            />
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-[28px] leading-none font-bold tabular text-zinc-900 dark:text-white">
                <AnimatedNumber value={value} />
              </p>
              {delta && <TrendDelta current={delta.current} previous={delta.previous} compact />}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
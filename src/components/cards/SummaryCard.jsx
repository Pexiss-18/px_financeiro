import { formatCurrency } from '../../utils/format'

export default function SummaryCard({ label, value, icon: Icon, accent, footer }) {
  return (
    <div className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-2 tracking-tight">{formatCurrency(value)}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent.bg}`}>
          <Icon className={`w-6 h-6 ${accent.text}`} />
        </div>
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}

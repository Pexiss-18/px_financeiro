import { Repeat, X } from 'lucide-react'
import { formatCurrency } from '../utils/format'

export default function RecurringList({ items, onDelete }) {
  if (!items.length) return null

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Repeat className="w-4 h-4" /> Recorrências
      </h3>
      <div className="space-y-2">
        {items.map((template) => (
          <div
            key={template.id}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/40 dark:bg-white/5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{template.description}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {template.category} • todo dia {template.day} • {formatCurrency(template.amount)}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Excluir recorrência ${template.description}`}
              onClick={() => onDelete(template.id)}
              className="w-7 h-7 shrink-0 rounded-lg text-slate-400 hover:text-expense hover:bg-expense/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Excluir uma recorrência não remove os lançamentos já gerados.
      </p>
    </div>
  )
}

import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export default function MonthSelector({ month, year, onPrev, onNext }) {
  return (
    <div className="glass-card flex items-center gap-1 px-2 py-1.5">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Mês anterior"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-semibold w-36 text-center select-none">
        {MONTH_LABELS[month - 1]} {year}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Próximo mês"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

import { ArrowDownCircle, LayoutDashboard, PiggyBank, Receipt } from 'lucide-react'

const ICONS = {
  dashboard: LayoutDashboard,
  income: ArrowDownCircle,
  expenses: Receipt,
  investments: PiggyBank,
}

const SHORT_LABELS = {
  dashboard: 'Visão',
  income: 'Receitas',
  expenses: 'Despesas',
  investments: 'Metas',
}

// Navegação inferior exibida apenas no mobile (a Sidebar cobre telas maiores)
export default function BottomNav({ activeTab, setActiveTab, tabs }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/20 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex">
        {Object.keys(tabs).map((key) => {
          const Icon = ICONS[key]
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-label={tabs[key]}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {SHORT_LABELS[key]}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

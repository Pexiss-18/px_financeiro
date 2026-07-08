import { ArrowDownCircle, LayoutDashboard, PiggyBank, Receipt, Wallet } from 'lucide-react'

const ICONS = {
  dashboard: LayoutDashboard,
  income: ArrowDownCircle,
  expenses: Receipt,
  investments: PiggyBank,
}

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  return (
    <aside className="w-20 lg:w-64 shrink-0 border-r border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl flex flex-col py-6">
      <div className="flex items-center gap-3 px-4 lg:px-6 mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <span className="hidden lg:block font-semibold text-lg tracking-tight">FinanPro</span>
      </div>
      <nav className="flex-1 flex flex-col gap-2 px-3 lg:px-4">
        {Object.entries(tabs).map(([key, label]) => {
          const Icon = ICONS[key]
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-500/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block text-sm font-medium">{label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

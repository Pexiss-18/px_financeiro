import { lazy, Suspense, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { useFinanceData } from './hooks/useFinanceData'

const Dashboard = lazy(() => import('./components/Dashboard'))
const IncomeManager = lazy(() => import('./components/IncomeManager'))
const ExpenseManager = lazy(() => import('./components/ExpenseManager'))
const InvestmentGoals = lazy(() => import('./components/InvestmentGoals'))

const TABS = {
  dashboard: 'Visão Geral',
  income: 'Receitas',
  expenses: 'Despesas & Orçamento',
  investments: 'Investimentos & Metas',
}

const THEME_KEY = 'px-financeiro:theme'

function getInitialDarkMode() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

function TabFallback() {
  return <p className="text-sm text-slate-400 py-16 text-center">Carregando...</p>
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(getInitialDarkMode)
  const finance = useFinanceData()

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
    } catch {
      // preferência de tema não é crítica
    }
  }, [darkMode])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex text-slate-900 dark:text-slate-100 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <TopBar title={TABS[activeTab]} darkMode={darkMode} setDarkMode={setDarkMode} finance={finance} />
          <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
            <Suspense fallback={<TabFallback />}>
              {activeTab === 'dashboard' && <Dashboard finance={finance} darkMode={darkMode} />}
              {activeTab === 'income' && <IncomeManager finance={finance} />}
              {activeTab === 'expenses' && <ExpenseManager finance={finance} />}
              {activeTab === 'investments' && <InvestmentGoals finance={finance} />}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import IncomeManager from './components/IncomeManager'
import ExpenseManager from './components/ExpenseManager'
import InvestmentGoals from './components/InvestmentGoals'
import { useFinanceData } from './hooks/useFinanceData'

const TABS = {
  dashboard: 'Visão Geral',
  income: 'Receitas',
  expenses: 'Despesas & Orçamento',
  investments: 'Investimentos & Metas',
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(true)
  const finance = useFinanceData()

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex text-slate-900 dark:text-slate-100 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <TopBar title={TABS[activeTab]} darkMode={darkMode} setDarkMode={setDarkMode} finance={finance} />
          <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
            {activeTab === 'dashboard' && <Dashboard finance={finance} darkMode={darkMode} />}
            {activeTab === 'income' && <IncomeManager finance={finance} />}
            {activeTab === 'expenses' && <ExpenseManager finance={finance} />}
            {activeTab === 'investments' && <InvestmentGoals finance={finance} />}
          </main>
        </div>
      </div>
    </div>
  )
}

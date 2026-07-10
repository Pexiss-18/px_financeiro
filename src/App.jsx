import { lazy, Suspense, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import LoginScreen from './components/LoginScreen'
import { useFinanceData } from './hooks/useFinanceData'
import { useCloudSync } from './hooks/useCloudSync'

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
const WELCOME_KEY = 'px-financeiro:welcome'

function getInitialWelcomeDismissed() {
  try {
    return localStorage.getItem(WELCOME_KEY) === 'ok'
  } catch {
    return true // sem localStorage, não insiste na tela de boas-vindas
  }
}

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
  const [welcomeDismissed, setWelcomeDismissed] = useState(getInitialWelcomeDismissed)
  const finance = useFinanceData()
  const sync = useCloudSync(finance)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
    } catch {
      // preferência de tema não é crítica
    }
  }, [darkMode])

  function dismissWelcome() {
    setWelcomeDismissed(true)
    try {
      localStorage.setItem(WELCOME_KEY, 'ok')
    } catch {
      // sem persistência, a tela volta na próxima visita — não é crítico
    }
  }

  // Quem completou o login (conta + frase) não precisa mais da tela inicial —
  // mas um conflito pendente mantém a tela até o usuário escolher a versão.
  const loggedAndReady = Boolean(sync.user && sync.hasKey && !sync.conflict)
  useEffect(() => {
    if (loggedAndReady && !welcomeDismissed) dismissWelcome()
  })

  // Tela inicial de login: primeira visita (até escolher "usar sem conta" ou
  // completar o login). Enquanto uma sessão anterior reconecta (authLoading
  // com a tela já dispensada), o app abre direto, sem piscar a tela de login.
  const showLogin = sync.configured && !welcomeDismissed && !loggedAndReady

  return (
    <div className={darkMode ? 'dark' : ''}>
      {showLogin ? (
        <LoginScreen sync={sync} onSkip={dismissWelcome} />
      ) : (
        <div className="min-h-screen flex text-slate-900 dark:text-slate-100 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <TopBar
              title={TABS[activeTab]}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              finance={finance}
              sync={sync}
            />
            <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-6 lg:p-10 overflow-y-auto">
              <Suspense fallback={<TabFallback />}>
                {activeTab === 'dashboard' && <Dashboard finance={finance} darkMode={darkMode} />}
                {activeTab === 'income' && <IncomeManager finance={finance} />}
                {activeTab === 'expenses' && <ExpenseManager finance={finance} />}
                {activeTab === 'investments' && <InvestmentGoals finance={finance} />}
              </Suspense>
            </main>
          </div>
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
        </div>
      )}
    </div>
  )
}

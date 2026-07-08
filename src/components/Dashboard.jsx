import { useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Pencil,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import SummaryCard from './cards/SummaryCard'
import { formatCurrency } from '../utils/format'
import ExpensesByCategoryChart from './charts/ExpensesByCategoryChart'
import BudgetVsActualChart from './charts/BudgetVsActualChart'
import EvolutionChart from './charts/EvolutionChart'

// invert: para despesas, queda em relação ao mês anterior é positiva
function Trend({ value, invert = false }) {
  if (value === null) {
    return <span className="text-xs text-slate-400">Sem dados do mês anterior</span>
  }
  const rising = value >= 0
  const good = invert ? !rising : rising
  const Icon = rising ? TrendingUp : TrendingDown
  const formatted = Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${good ? 'text-income' : 'text-expense'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {rising ? '+' : '-'}
      {formatted}% vs mês anterior
    </span>
  )
}

function InitialBalanceEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(value))

  function handleSave() {
    const parsed = parseFloat(input)
    if (!Number.isNaN(parsed)) onSave(parsed)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
        Saldo inicial: {formatCurrency(value)}
        <button
          type="button"
          aria-label="Editar saldo inicial"
          onClick={() => {
            setInput(String(value))
            setEditing(true)
          }}
          className="text-slate-400 hover:text-indigo-500 transition-colors"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="number"
        step="0.01"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setEditing(false)
        }}
        aria-label="Saldo inicial"
        autoFocus
        className="w-28 px-2 py-1 text-xs rounded-lg bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      />
      <button
        type="button"
        aria-label="Salvar saldo inicial"
        onClick={handleSave}
        className="w-5 h-5 rounded-md bg-income/10 text-income flex items-center justify-center hover:bg-income/20 transition-colors"
      >
        <Check className="w-3 h-3" />
      </button>
      <button
        type="button"
        aria-label="Cancelar edição do saldo inicial"
        onClick={() => setEditing(false)}
        className="w-5 h-5 rounded-md bg-slate-200/60 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300/60 dark:hover:bg-white/20 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

export default function Dashboard({ finance, darkMode }) {
  const {
    balance,
    totalIncome,
    totalExpenses,
    totalInvested,
    totalInvestTarget,
    budget,
    expensesByCategory,
    incomeTrend,
    expenseTrend,
    monthlyEvolution,
    initialBalance,
    setInitialBalance,
  } = finance
  const investPct = totalInvestTarget > 0 ? Math.round((totalInvested / totalInvestTarget) * 100) : 0

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          label="Saldo Total"
          value={balance}
          icon={Wallet}
          accent={{ bg: 'bg-indigo-500/10', text: 'text-indigo-500' }}
          footer={
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Acumulado até o fim do mês</span>
              <InitialBalanceEditor value={initialBalance} onSave={setInitialBalance} />
            </div>
          }
        />
        <SummaryCard
          label="Receitas do Mês"
          value={totalIncome}
          icon={ArrowDownCircle}
          accent={{ bg: 'bg-income/10', text: 'text-income' }}
          footer={<Trend value={incomeTrend} />}
        />
        <SummaryCard
          label="Despesas do Mês"
          value={totalExpenses}
          icon={ArrowUpCircle}
          accent={{ bg: 'bg-expense/10', text: 'text-expense' }}
          footer={<Trend value={expenseTrend} invert />}
        />
        <SummaryCard
          label="Investido"
          value={totalInvested}
          icon={PiggyBank}
          accent={{ bg: 'bg-invest/10', text: 'text-invest' }}
          footer={
            <span className="text-xs font-semibold text-invest">{investPct}% da meta total atingida</span>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-4">Despesas por Categoria</h2>
          <ExpensesByCategoryChart data={expensesByCategory} />
        </div>
        <div className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-4">Orçamento vs Realizado</h2>
          <BudgetVsActualChart budget={budget} actual={totalExpenses} darkMode={darkMode} />
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold text-lg mb-4">Evolução dos Últimos 6 Meses</h2>
        <EvolutionChart data={monthlyEvolution} darkMode={darkMode} />
      </div>
    </div>
  )
}

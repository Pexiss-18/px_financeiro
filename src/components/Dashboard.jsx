import { ArrowDownCircle, ArrowUpCircle, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import SummaryCard from './cards/SummaryCard'
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
          footer={<span className="text-xs text-slate-400">Acumulado até o fim do mês</span>}
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

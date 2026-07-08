import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../../utils/format'

export default function BudgetVsActualChart({ budget, actual, darkMode }) {
  const data = [
    { name: 'Orçamento', value: budget },
    { name: 'Gasto', value: actual },
  ]
  const overBudget = actual > budget
  const tickColor = darkMode ? '#cbd5e1' : '#475569'

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={60}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: tickColor }} />
          <YAxis hide />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
            <Cell fill="#6366f1" />
            <Cell fill={overBudget ? '#f43f5e' : '#22c55e'} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center text-sm font-medium">
        {overBudget ? (
          <span className="text-expense">Orçamento excedido em {formatCurrency(actual - budget)}</span>
        ) : (
          <span className="text-income">Dentro do orçamento, restam {formatCurrency(budget - actual)}</span>
        )}
      </div>
    </div>
  )
}

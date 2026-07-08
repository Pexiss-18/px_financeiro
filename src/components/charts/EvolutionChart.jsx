import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../../utils/format'

export default function EvolutionChart({ data, darkMode }) {
  const tickColor = darkMode ? '#cbd5e1' : '#475569'
  const gridColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={70}
          tick={{ fontSize: 11, fill: tickColor }}
          tickFormatter={(value) => value.toLocaleString('pt-BR', { notation: 'compact' })}
        />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="balance" name="Saldo" stroke="#6366f1" strokeWidth={2.5} dot={false} />
        <Line
          type="monotone"
          dataKey="income"
          name="Receitas"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Despesas"
          stroke="#f43f5e"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

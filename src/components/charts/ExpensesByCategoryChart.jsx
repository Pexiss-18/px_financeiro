import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { categoryColors } from '../../data/categories'
import { formatCurrency } from '../../utils/format'

const FALLBACK_COLORS = ['#f43f5e', '#f97316', '#eab308', '#a855f7', '#06b6d4', '#64748b']

export default function ExpensesByCategoryChart({ data }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400 py-16 text-center">Nenhuma despesa registrada ainda.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={categoryColors[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

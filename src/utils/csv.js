import { formatDateBR } from './date'

function escapeField(value) {
  const str = String(value)
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

// Separador ';', decimais com vírgula e BOM: formato que o Excel pt-BR abre direto
export function buildTransactionsCsv(incomes, expenses) {
  const transactions = [
    ...incomes.map((t) => ({ type: 'Receita', ...t })),
    ...expenses.map((t) => ({ type: 'Despesa', ...t })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const rows = [
    ['Tipo', 'Data', 'Descrição', 'Categoria', 'Valor'],
    ...transactions.map((t) => [
      t.type,
      formatDateBR(t.date),
      t.description,
      t.category,
      t.amount.toFixed(2).replace('.', ','),
    ]),
  ]
  return '﻿' + rows.map((row) => row.map(escapeField).join(';')).join('\r\n')
}

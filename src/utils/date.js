export function getDefaultDateForMonth(year, month) {
  const now = new Date()
  if (year === now.getFullYear() && month === now.getMonth() + 1) {
    return now.toISOString().slice(0, 10)
  }
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export function isSameMonth(dateStr, year, month) {
  if (!dateStr) return false
  const [y, m] = dateStr.split('-').map(Number)
  return y === year && m === month
}

export function isOnOrBeforeMonth(dateStr, year, month) {
  if (!dateStr) return false
  const [y, m] = dateStr.split('-').map(Number)
  return y < year || (y === year && m <= month)
}

export function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function nextMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  return m === 12 ? monthKey(y + 1, 1) : monthKey(y, m + 1)
}

// Retorna 'YYYY-MM-DD' para o mês da chave, com o dia limitado ao último dia do mês
export function dateForMonthKey(key, day) {
  const [y, m] = key.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return `${key}-${String(Math.min(day, lastDay)).padStart(2, '0')}`
}

const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function shortMonthLabel(year, month) {
  return `${SHORT_MONTHS[month - 1]}/${String(year).slice(2)}`
}

export function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

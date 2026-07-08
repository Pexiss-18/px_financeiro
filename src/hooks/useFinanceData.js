import { useEffect, useMemo, useState } from 'react'
import {
  accountBalance,
  initialBudget,
  initialExpenses,
  initialGoals,
  initialIncomes,
} from '../data/mockData'
import { isOnOrBeforeMonth, isSameMonth, monthKey, shortMonthLabel } from '../utils/date'

const STORAGE_KEY = 'px-financeiro:data'

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function sumAmounts(items) {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

// Orçamentos são guardados por mês ({ 'YYYY-MM': valor }); a chave 'default'
// cobre meses sem valor próprio e absorve o formato antigo (número único).
function normalizeBudgets(data) {
  if (data?.budgets && typeof data.budgets === 'object') return data.budgets
  if (typeof data?.budget === 'number') return { default: data.budget }
  return { default: initialBudget }
}

const stored = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
})()

export function useFinanceData() {
  const now = new Date()
  const [incomes, setIncomes] = useState(stored?.incomes ?? initialIncomes)
  const [expenses, setExpenses] = useState(stored?.expenses ?? initialExpenses)
  const [budgets, setBudgets] = useState(() => normalizeBudgets(stored))
  const [goals, setGoals] = useState(stored?.goals ?? initialGoals)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [storageError, setStorageError] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ incomes, expenses, budgets, goals }))
      setStorageError(null)
    } catch (error) {
      console.error('Falha ao salvar dados no localStorage:', error)
      setStorageError(
        'Não foi possível salvar seus dados no navegador. Exporte um backup para não perdê-los.'
      )
    }
  }, [incomes, expenses, budgets, goals])

  const filteredIncomes = useMemo(
    () => incomes.filter((i) => isSameMonth(i.date, selectedYear, selectedMonth)),
    [incomes, selectedYear, selectedMonth]
  )
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isSameMonth(e.date, selectedYear, selectedMonth)),
    [expenses, selectedYear, selectedMonth]
  )

  const totalIncome = useMemo(() => sumAmounts(filteredIncomes), [filteredIncomes])
  const totalExpenses = useMemo(() => sumAmounts(filteredExpenses), [filteredExpenses])
  const totalInvested = useMemo(() => goals.reduce((sum, g) => sum + g.current, 0), [goals])
  const totalInvestTarget = useMemo(() => goals.reduce((sum, g) => sum + g.target, 0), [goals])

  // Saldo acumulado até o fim do mês selecionado
  const balance = useMemo(
    () =>
      accountBalance +
      sumAmounts(incomes.filter((i) => isOnOrBeforeMonth(i.date, selectedYear, selectedMonth))) -
      sumAmounts(expenses.filter((e) => isOnOrBeforeMonth(e.date, selectedYear, selectedMonth))),
    [incomes, expenses, selectedYear, selectedMonth]
  )

  const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
  const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear

  const previousIncome = useMemo(
    () => sumAmounts(incomes.filter((i) => isSameMonth(i.date, previousYear, previousMonth))),
    [incomes, previousYear, previousMonth]
  )
  const previousExpenses = useMemo(
    () => sumAmounts(expenses.filter((e) => isSameMonth(e.date, previousYear, previousMonth))),
    [expenses, previousYear, previousMonth]
  )

  const incomeTrend = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : null
  const expenseTrend =
    previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : null

  const budget = budgets[monthKey(selectedYear, selectedMonth)] ?? budgets.default ?? 0
  const budgetUsedPct = budget > 0 ? (totalExpenses / budget) * 100 : 0

  function setBudget(value) {
    setBudgets((prev) => ({ ...prev, [monthKey(selectedYear, selectedMonth)]: value }))
  }

  const expensesByCategory = useMemo(() => {
    const map = {}
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filteredExpenses])

  // Receitas, despesas e saldo acumulado dos últimos 6 meses (terminando no mês selecionado)
  const monthlyEvolution = useMemo(() => {
    const months = []
    let year = selectedYear
    let month = selectedMonth
    for (let i = 0; i < 6; i++) {
      months.unshift({ year, month })
      month -= 1
      if (month === 0) {
        month = 12
        year -= 1
      }
    }
    return months.map(({ year, month }) => ({
      label: shortMonthLabel(year, month),
      income: sumAmounts(incomes.filter((i) => isSameMonth(i.date, year, month))),
      expense: sumAmounts(expenses.filter((e) => isSameMonth(e.date, year, month))),
      balance:
        accountBalance +
        sumAmounts(incomes.filter((i) => isOnOrBeforeMonth(i.date, year, month))) -
        sumAmounts(expenses.filter((e) => isOnOrBeforeMonth(e.date, year, month))),
    }))
  }, [incomes, expenses, selectedYear, selectedMonth])

  function addIncome(income) {
    setIncomes((prev) => [...prev, { ...income, id: newId() }])
  }

  function editIncome(id, updates) {
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }

  function deleteIncome(id) {
    setIncomes((prev) => prev.filter((i) => i.id !== id))
  }

  function addExpense(expense) {
    setExpenses((prev) => [...prev, { ...expense, id: newId() }])
  }

  function editExpense(id, updates) {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }

  function deleteExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  function addGoal(goal) {
    setGoals((prev) => [...prev, { ...goal, id: newId(), current: 0 }])
  }

  function editGoal(id, updates) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)))
  }

  function deleteGoal(id) {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  function addContribution(goalId, amount) {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, current: g.current + amount } : g)))
  }

  function goToPreviousMonth() {
    setSelectedMonth((prevMonth) => {
      if (prevMonth === 1) {
        setSelectedYear((prevYear) => prevYear - 1)
        return 12
      }
      return prevMonth - 1
    })
  }

  function goToNextMonth() {
    setSelectedMonth((prevMonth) => {
      if (prevMonth === 12) {
        setSelectedYear((prevYear) => prevYear + 1)
        return 1
      }
      return prevMonth + 1
    })
  }

  function exportData() {
    return {
      app: 'px-financeiro',
      version: 1,
      exportedAt: new Date().toISOString(),
      incomes,
      expenses,
      budgets,
      goals,
    }
  }

  function importData(data) {
    if (
      !data ||
      typeof data !== 'object' ||
      !Array.isArray(data.incomes) ||
      !Array.isArray(data.expenses) ||
      !Array.isArray(data.goals)
    ) {
      throw new Error('Arquivo inválido: esperado um backup exportado pelo px-financeiro.')
    }
    setIncomes(data.incomes)
    setExpenses(data.expenses)
    setGoals(data.goals)
    setBudgets(normalizeBudgets(data))
  }

  function resetData() {
    setIncomes(initialIncomes)
    setExpenses(initialExpenses)
    setBudgets({ default: initialBudget })
    setGoals(initialGoals)
  }

  return {
    incomes,
    expenses,
    budget,
    goals,
    filteredIncomes,
    filteredExpenses,
    selectedMonth,
    selectedYear,
    totalIncome,
    totalExpenses,
    totalInvested,
    totalInvestTarget,
    balance,
    budgetUsedPct,
    incomeTrend,
    expenseTrend,
    expensesByCategory,
    monthlyEvolution,
    storageError,
    addIncome,
    editIncome,
    deleteIncome,
    addExpense,
    editExpense,
    deleteExpense,
    addGoal,
    editGoal,
    deleteGoal,
    addContribution,
    setBudget,
    goToPreviousMonth,
    goToNextMonth,
    exportData,
    importData,
    resetData,
  }
}

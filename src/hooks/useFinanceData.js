import { useEffect, useMemo, useRef, useState } from 'react'
import {
  accountBalance,
  initialBudget,
  initialExpenses,
  initialGoals,
  initialIncomes,
} from '../data/mockData'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories'
import {
  dateForMonthKey,
  isOnOrBeforeMonth,
  isSameMonth,
  monthKey,
  nextMonthKey,
  shortMonthLabel,
} from '../utils/date'

const STORAGE_KEY = 'px-financeiro:data'

export function newId() {
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
export function normalizeBudgets(data) {
  if (data?.budgets && typeof data.budgets === 'object') return data.budgets
  if (typeof data?.budget === 'number') return { default: data.budget }
  return { default: initialBudget }
}

// Backups v1 não têm categories/recurring/initialBalance
function normalizeCategories(data) {
  const cats = data?.categories
  if (cats && Array.isArray(cats.income) && Array.isArray(cats.expense)) return cats
  return { income: INCOME_CATEGORIES, expense: EXPENSE_CATEGORIES }
}

function normalizeInitialBalance(data) {
  return typeof data?.initialBalance === 'number' ? data.initialBalance : accountBalance
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
  const [recurring, setRecurring] = useState(stored?.recurring ?? [])
  const [categories, setCategories] = useState(() => normalizeCategories(stored))
  const [initialBalance, setInitialBalance] = useState(() => normalizeInitialBalance(stored))
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [storageError, setStorageError] = useState(null)

  // Carimbo (ms) da última alteração feita pelo usuário — é o que decide, na
  // sincronização entre aparelhos, qual versão dos dados é a mais recente
  // ("última escrita vence"). 0 = dados de exemplo nunca alterados.
  const [dataUpdatedAt, setDataUpdatedAt] = useState(stored?.updatedAt ?? 0)
  const dataUpdatedAtRef = useRef(stored?.updatedAt ?? 0)
  // Serialização da última gravação: o carimbo só avança quando o CONTEÚDO
  // muda de fato. Isso evita carimbos falsos em regravações da montagem
  // (ex.: StrictMode/HMR rodam o efeito de novo com os mesmos dados), que
  // fariam dados de exemplo intocados parecerem mais novos que a nuvem.
  const lastSavedRef = useRef(null)
  // Quando dados vindos da nuvem são aplicados, eles devem manter o carimbo
  // remoto (avançar o carimbo faria o aparelho reenviar o que acabou de receber).
  const pendingStampRef = useRef(null)

  useEffect(() => {
    const payload = { incomes, expenses, budgets, goals, recurring, categories, initialBalance }
    const serialized = JSON.stringify(payload)
    const pending = pendingStampRef.current
    pendingStampRef.current = null
    let stamp
    if (pending !== null) {
      stamp = pending
    } else if (lastSavedRef.current === null || lastSavedRef.current === serialized) {
      // primeira gravação desta montagem, ou conteúdo idêntico ao já salvo
      stamp = dataUpdatedAtRef.current
    } else {
      stamp = Math.max(Date.now(), dataUpdatedAtRef.current + 1)
    }
    lastSavedRef.current = serialized
    dataUpdatedAtRef.current = stamp
    setDataUpdatedAt(stamp)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, updatedAt: stamp }))
      setStorageError(null)
    } catch (error) {
      console.error('Falha ao salvar dados no localStorage:', error)
      setStorageError(
        'Não foi possível salvar seus dados no navegador. Exporte um backup para não perdê-los.'
      )
    }
  }, [incomes, expenses, budgets, goals, recurring, categories, initialBalance])

  // Materializa transações recorrentes: para cada modelo, gera as ocorrências dos
  // meses entre a última geração e o mês selecionado (idempotente — ocorrências
  // excluídas pelo usuário não voltam, pois lastGeneratedKey só avança).
  useEffect(() => {
    const selectedKey = monthKey(selectedYear, selectedMonth)
    const newIncomes = []
    const newExpenses = []
    let changed = false
    const updated = recurring.map((template) => {
      if (template.lastGeneratedKey >= selectedKey) return template
      let key = nextMonthKey(template.lastGeneratedKey)
      while (key <= selectedKey) {
        const occurrence = {
          id: newId(),
          description: template.description,
          amount: template.amount,
          category: template.category,
          date: dateForMonthKey(key, template.day),
          recurringId: template.id,
        }
        if (template.type === 'income') newIncomes.push(occurrence)
        else newExpenses.push(occurrence)
        key = nextMonthKey(key)
      }
      changed = true
      return { ...template, lastGeneratedKey: selectedKey }
    })
    if (!changed) return
    if (newIncomes.length) setIncomes((prev) => [...prev, ...newIncomes])
    if (newExpenses.length) setExpenses((prev) => [...prev, ...newExpenses])
    setRecurring(updated)
  }, [selectedYear, selectedMonth, recurring])

  const filteredIncomes = useMemo(
    () =>
      incomes
        .filter((i) => isSameMonth(i.date, selectedYear, selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [incomes, selectedYear, selectedMonth]
  )
  const filteredExpenses = useMemo(
    () =>
      expenses
        .filter((e) => isSameMonth(e.date, selectedYear, selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, selectedYear, selectedMonth]
  )

  const totalIncome = useMemo(() => sumAmounts(filteredIncomes), [filteredIncomes])
  const totalExpenses = useMemo(() => sumAmounts(filteredExpenses), [filteredExpenses])
  const totalInvested = useMemo(() => goals.reduce((sum, g) => sum + g.current, 0), [goals])
  const totalInvestTarget = useMemo(() => goals.reduce((sum, g) => sum + g.target, 0), [goals])

  // Saldo acumulado até o fim do mês selecionado
  const balance = useMemo(
    () =>
      initialBalance +
      sumAmounts(incomes.filter((i) => isOnOrBeforeMonth(i.date, selectedYear, selectedMonth))) -
      sumAmounts(expenses.filter((e) => isOnOrBeforeMonth(e.date, selectedYear, selectedMonth))),
    [incomes, expenses, initialBalance, selectedYear, selectedMonth]
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
        initialBalance +
        sumAmounts(incomes.filter((i) => isOnOrBeforeMonth(i.date, year, month))) -
        sumAmounts(expenses.filter((e) => isOnOrBeforeMonth(e.date, year, month))),
    }))
  }, [incomes, expenses, initialBalance, selectedYear, selectedMonth])

  function makeRecurringTemplate(type, transaction) {
    const startKey = transaction.date.slice(0, 7)
    return {
      id: newId(),
      type,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      day: Number(transaction.date.slice(8, 10)),
      startKey,
      lastGeneratedKey: startKey,
    }
  }

  function addIncome(income, repeatMonthly = false) {
    setIncomes((prev) => [...prev, { ...income, id: newId() }])
    if (repeatMonthly) {
      setRecurring((prev) => [...prev, makeRecurringTemplate('income', income)])
    }
  }

  function editIncome(id, updates) {
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }

  function deleteIncome(id) {
    setIncomes((prev) => prev.filter((i) => i.id !== id))
  }

  function addExpense(expense, repeatMonthly = false) {
    setExpenses((prev) => [...prev, { ...expense, id: newId() }])
    if (repeatMonthly) {
      setRecurring((prev) => [...prev, makeRecurringTemplate('expense', expense)])
    }
  }

  function editExpense(id, updates) {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }

  function deleteExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  function deleteRecurring(id) {
    setRecurring((prev) => prev.filter((t) => t.id !== id))
  }

  function addCategory(type, name) {
    const trimmed = name.trim()
    if (!trimmed) return 'Informe um nome'
    const exists = categories[type].some((c) => c.toLowerCase() === trimmed.toLowerCase())
    if (exists) return 'Essa categoria já existe'
    setCategories((prev) => ({ ...prev, [type]: [...prev[type], trimmed] }))
    return null
  }

  function removeCategory(type, name) {
    if (categories[type].length <= 1) return 'Mantenha ao menos uma categoria'
    const inUse =
      type === 'income' ? incomes.some((i) => i.category === name) : expenses.some((e) => e.category === name)
    if (inUse) return 'Categoria em uso por lançamentos existentes'
    const inRecurringUse = recurring.some((t) => t.type === type && t.category === name)
    if (inRecurringUse) return 'Categoria em uso por uma recorrência'
    setCategories((prev) => ({ ...prev, [type]: prev[type].filter((c) => c !== name) }))
    return null
  }

  function addGoal(goal) {
    setGoals((prev) => [...prev, { ...goal, id: newId(), current: 0, history: [] }])
  }

  function editGoal(id, updates) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)))
  }

  function deleteGoal(id) {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  function addContribution(goalId, amount) {
    const entry = { id: newId(), date: new Date().toISOString().slice(0, 10), amount }
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, current: g.current + amount, history: [...(g.history ?? []), entry] } : g
      )
    )
  }

  function deleteContribution(goalId, entryId) {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g
        const entry = (g.history ?? []).find((h) => h.id === entryId)
        if (!entry) return g
        return {
          ...g,
          current: g.current - entry.amount,
          history: g.history.filter((h) => h.id !== entryId),
        }
      })
    )
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
      version: 2,
      exportedAt: new Date().toISOString(),
      incomes,
      expenses,
      budgets,
      goals,
      recurring,
      categories,
      initialBalance,
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
    setRecurring(Array.isArray(data.recurring) ? data.recurring : [])
    setCategories(normalizeCategories(data))
    setInitialBalance(normalizeInitialBalance(data))
  }

  // Aplica dados recebidos da nuvem preservando o carimbo remoto.
  function applyRemoteData(data, remoteUpdatedAt) {
    pendingStampRef.current = remoteUpdatedAt
    try {
      importData(data)
    } catch (error) {
      pendingStampRef.current = null
      throw error
    }
  }

  // Reaplica os dados atuais com um carimbo novo — usado pela sincronização
  // para forçar o envio (ex.: primeira subida ou "usar dados deste aparelho").
  function touchData(minStamp = 0) {
    const snapshot = exportData()
    // Clona um dos arrays: com as mesmas referências o React ignoraria a
    // atualização e o efeito de persistência (que grava o carimbo) não rodaria.
    applyRemoteData(
      { ...snapshot, incomes: [...snapshot.incomes] },
      Math.max(Date.now(), dataUpdatedAtRef.current + 1, minStamp)
    )
  }

  function resetData() {
    setIncomes(initialIncomes)
    setExpenses(initialExpenses)
    setBudgets({ default: initialBudget })
    setGoals(initialGoals)
    setRecurring([])
    setCategories({ income: INCOME_CATEGORIES, expense: EXPENSE_CATEGORIES })
    setInitialBalance(accountBalance)
  }

  return {
    incomes,
    expenses,
    budget,
    goals,
    recurring,
    categories,
    initialBalance,
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
    dataUpdatedAt,
    applyRemoteData,
    touchData,
    addIncome,
    editIncome,
    deleteIncome,
    addExpense,
    editExpense,
    deleteExpense,
    deleteRecurring,
    addCategory,
    removeCategory,
    addGoal,
    editGoal,
    deleteGoal,
    addContribution,
    deleteContribution,
    setBudget,
    setInitialBalance,
    goToPreviousMonth,
    goToNextMonth,
    exportData,
    importData,
    resetData,
  }
}

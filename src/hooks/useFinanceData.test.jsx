import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { newId, normalizeBudgets, useFinanceData } from './useFinanceData'

// Os dados de exemplo (mockData) são de junho/2026; fixamos "hoje" em julho/2026
// para que os cálculos sejam determinísticos.
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-15T12:00:00'))
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

function setup() {
  return renderHook(() => useFinanceData())
}

describe('normalizeBudgets', () => {
  it('migra o formato antigo (número único) para orçamento por mês', () => {
    expect(normalizeBudgets({ budget: 4000 })).toEqual({ default: 4000 })
  })

  it('mantém o formato novo e usa o padrão quando não há dados', () => {
    expect(normalizeBudgets({ budgets: { '2026-06': 7000 } })).toEqual({ '2026-06': 7000 })
    expect(normalizeBudgets(null)).toEqual({ default: 5800 })
  })
})

describe('newId', () => {
  it('gera ids únicos', () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId()))
    expect(ids.size).toBe(100)
  })
})

describe('useFinanceData', () => {
  it('calcula o saldo acumulado até o fim do mês selecionado', () => {
    const { result } = setup()
    // julho/2026: saldo inicial 24650 + receitas de junho 10040 - despesas de junho 4670
    expect(result.current.balance).toBe(30020)
    act(() => result.current.goToPreviousMonth())
    // junho tem os mesmos lançamentos acumulados
    expect(result.current.balance).toBe(30020)
  })

  it('calcula o trend em relação ao mês anterior (null sem dados)', () => {
    const { result } = setup()
    // julho: 0 de receitas vs 10040 em junho
    expect(result.current.incomeTrend).toBe(-100)
    expect(result.current.expenseTrend).toBe(-100)
    act(() => result.current.goToPreviousMonth())
    // junho: maio não tem dados
    expect(result.current.incomeTrend).toBeNull()
    expect(result.current.expenseTrend).toBeNull()
  })

  it('ordena as transações do mês por data decrescente', () => {
    const { result } = setup()
    act(() => result.current.goToPreviousMonth())
    const dates = result.current.filteredIncomes.map((i) => i.date)
    expect(dates).toEqual(['2026-06-15', '2026-06-12', '2026-06-05'])
  })

  it('mantém o orçamento por mês, com valor padrão para meses sem ajuste', () => {
    const { result } = setup()
    expect(result.current.budget).toBe(5800)
    act(() => result.current.setBudget(7000))
    expect(result.current.budget).toBe(7000)
    act(() => result.current.goToPreviousMonth())
    expect(result.current.budget).toBe(5800)
    act(() => result.current.goToNextMonth())
    expect(result.current.budget).toBe(7000)
  })

  it('gera ids únicos para novos lançamentos', () => {
    const { result } = setup()
    act(() => {
      result.current.addIncome({ description: 'A', amount: 1, date: '2026-07-01', category: 'Extra' })
      result.current.addIncome({ description: 'B', amount: 1, date: '2026-07-01', category: 'Extra' })
    })
    const ids = result.current.incomes.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('materializa recorrências nos meses seguintes sem recriar ocorrências excluídas', () => {
    const { result } = setup()
    act(() =>
      result.current.addExpense(
        { description: 'Aluguel', amount: 2200, date: '2026-07-05', category: 'Moradia' },
        true
      )
    )
    expect(result.current.recurring).toHaveLength(1)

    // agosto: ocorrência gerada automaticamente
    act(() => result.current.goToNextMonth())
    const generated = result.current.filteredExpenses.find((e) => e.recurringId)
    expect(generated).toBeDefined()
    expect(generated.date).toBe('2026-08-05')
    expect(generated.description).toBe('Aluguel')

    // excluir a ocorrência e navegar não a recria
    act(() => result.current.deleteExpense(generated.id))
    act(() => result.current.goToPreviousMonth())
    act(() => result.current.goToNextMonth())
    expect(result.current.filteredExpenses.some((e) => e.recurringId)).toBe(false)
  })

  it('preenche meses pulados e limita o dia ao fim do mês', () => {
    const { result } = setup()
    act(() =>
      result.current.addIncome(
        { description: 'Salário', amount: 100, date: '2026-07-31', category: 'Salário' },
        true
      )
    )
    // pula direto para setembro (30 dias)
    act(() => {
      result.current.goToNextMonth()
      result.current.goToNextMonth()
    })
    const dates = result.current.incomes.filter((i) => i.recurringId).map((i) => i.date)
    expect(dates).toContain('2026-08-31')
    expect(dates).toContain('2026-09-30')
  })

  it('registra e exclui aportes no histórico da meta', () => {
    const { result } = setup()
    const goal = result.current.goals[0]
    const before = goal.current
    act(() => result.current.addContribution(goal.id, 500))
    let updated = result.current.goals.find((g) => g.id === goal.id)
    expect(updated.current).toBe(before + 500)
    expect(updated.history).toHaveLength(1)
    expect(updated.history[0]).toMatchObject({ date: '2026-07-15', amount: 500 })

    act(() => result.current.deleteContribution(goal.id, updated.history[0].id))
    updated = result.current.goals.find((g) => g.id === goal.id)
    expect(updated.current).toBe(before)
    expect(updated.history).toHaveLength(0)
  })

  it('gerencia categorias, bloqueando remoção em uso e duplicatas', () => {
    const { result } = setup()
    let error
    act(() => {
      error = result.current.addCategory('income', 'Aluguel recebido')
    })
    expect(error).toBeNull()
    expect(result.current.categories.income).toContain('Aluguel recebido')

    act(() => {
      error = result.current.addCategory('income', 'aluguel recebido')
    })
    expect(error).toBeTruthy()

    // 'Moradia' está em uso pelas despesas de exemplo
    act(() => {
      error = result.current.removeCategory('expense', 'Moradia')
    })
    expect(error).toBeTruthy()
    expect(result.current.categories.expense).toContain('Moradia')

    // 'Outros' (receitas) não é usada pelos dados de exemplo
    act(() => {
      error = result.current.removeCategory('income', 'Outros')
    })
    expect(error).toBeNull()
    expect(result.current.categories.income).not.toContain('Outros')
  })

  it('recalcula o saldo ao editar o saldo inicial', () => {
    const { result } = setup()
    act(() => result.current.setInitialBalance(1000))
    expect(result.current.balance).toBe(1000 + 10040 - 4670)
  })

  it('rejeita importação de arquivo inválido', () => {
    const { result } = setup()
    expect(() => result.current.importData({ foo: 'bar' })).toThrow(/inválido/i)
  })

  it('importa backup v1 aplicando padrões para os campos novos', () => {
    const { result } = setup()
    act(() =>
      result.current.importData({
        incomes: [],
        expenses: [],
        goals: [],
        budget: 3000,
      })
    )
    expect(result.current.budget).toBe(3000)
    expect(result.current.recurring).toEqual([])
    expect(result.current.categories.expense).toContain('Moradia')
    expect(result.current.initialBalance).toBe(24650)
  })

  it('avança o carimbo de sincronização em alterações e preserva o carimbo remoto', () => {
    const { result } = setup()
    // dados de exemplo intocados: carimbo 0 (nunca sobe para a nuvem sozinho)
    expect(result.current.dataUpdatedAt).toBe(0)

    act(() =>
      result.current.addIncome({ description: 'A', amount: 1, date: '2026-07-01', category: 'Extra' })
    )
    const stamp = result.current.dataUpdatedAt
    expect(stamp).toBeGreaterThan(0)
    expect(JSON.parse(localStorage.getItem('px-financeiro:data')).updatedAt).toBe(stamp)

    // dados vindos da nuvem mantêm o carimbo remoto (não disparam reenvio)
    act(() =>
      result.current.applyRemoteData({ incomes: [], expenses: [], goals: [] }, 1234567890)
    )
    expect(result.current.dataUpdatedAt).toBe(1234567890)
    expect(JSON.parse(localStorage.getItem('px-financeiro:data')).updatedAt).toBe(1234567890)

    // touchData força um carimbo mais novo que o mínimo pedido
    act(() => result.current.touchData(9999999999999))
    expect(result.current.dataUpdatedAt).toBeGreaterThanOrEqual(9999999999999)
  })

  it('exporta backup v2 com todos os campos', () => {
    const { result } = setup()
    const data = result.current.exportData()
    expect(data.version).toBe(2)
    expect(data).toHaveProperty('incomes')
    expect(data).toHaveProperty('expenses')
    expect(data).toHaveProperty('budgets')
    expect(data).toHaveProperty('goals')
    expect(data).toHaveProperty('recurring')
    expect(data).toHaveProperty('categories')
    expect(data).toHaveProperty('initialBalance')
  })
})

import { describe, expect, it } from 'vitest'
import {
  dateForMonthKey,
  isOnOrBeforeMonth,
  isSameMonth,
  monthKey,
  nextMonthKey,
  shortMonthLabel,
} from './date'
import { buildTransactionsCsv } from './csv'
import { normalizeSearchText } from './text'
import { formatCurrency } from './format'
import { getAmountError } from './validation'

describe('date utils', () => {
  it('isSameMonth compara ano e mês', () => {
    expect(isSameMonth('2026-06-15', 2026, 6)).toBe(true)
    expect(isSameMonth('2026-07-01', 2026, 6)).toBe(false)
    expect(isSameMonth(null, 2026, 6)).toBe(false)
  })

  it('isOnOrBeforeMonth aceita meses anteriores e o próprio mês', () => {
    expect(isOnOrBeforeMonth('2026-05-31', 2026, 6)).toBe(true)
    expect(isOnOrBeforeMonth('2026-06-30', 2026, 6)).toBe(true)
    expect(isOnOrBeforeMonth('2026-07-01', 2026, 6)).toBe(false)
    expect(isOnOrBeforeMonth('2025-12-01', 2026, 6)).toBe(true)
  })

  it('monthKey formata com zero à esquerda', () => {
    expect(monthKey(2026, 6)).toBe('2026-06')
    expect(monthKey(2026, 12)).toBe('2026-12')
  })

  it('nextMonthKey vira o ano em dezembro', () => {
    expect(nextMonthKey('2026-06')).toBe('2026-07')
    expect(nextMonthKey('2026-12')).toBe('2027-01')
  })

  it('dateForMonthKey limita o dia ao fim do mês', () => {
    expect(dateForMonthKey('2026-08', 31)).toBe('2026-08-31')
    expect(dateForMonthKey('2026-09', 31)).toBe('2026-09-30')
    expect(dateForMonthKey('2026-02', 31)).toBe('2026-02-28')
  })

  it('shortMonthLabel abrevia mês e ano', () => {
    expect(shortMonthLabel(2026, 6)).toBe('Jun/26')
    expect(shortMonthLabel(2025, 12)).toBe('Dez/25')
  })
})

describe('buildTransactionsCsv', () => {
  const incomes = [{ id: 1, description: 'Salário', amount: 8500, date: '2026-06-05', category: 'Salário' }]
  const expenses = [
    { id: 2, description: 'Pão; leite', amount: 25.5, date: '2026-06-02', category: 'Alimentação' },
  ]

  it('gera CSV com BOM, separador ; e decimais com vírgula, ordenado por data', () => {
    const csv = buildTransactionsCsv(incomes, expenses)
    expect(csv.codePointAt(0)).toBe(0xfeff)
    const lines = csv.slice(1).split('\r\n')
    expect(lines[0]).toBe('Tipo;Data;Descrição;Categoria;Valor')
    expect(lines[1]).toBe('Despesa;02/06/2026;"Pão; leite";Alimentação;25,50')
    expect(lines[2]).toBe('Receita;05/06/2026;Salário;Salário;8500,00')
  })
})

describe('normalizeSearchText', () => {
  it('remove acentos e caixa', () => {
    expect(normalizeSearchText('Salário')).toBe('salario')
    expect(normalizeSearchText('ALIMENTAÇÃO')).toBe('alimentacao')
  })
})

describe('formatCurrency', () => {
  it('formata em BRL', () => {
    // toLocaleString usa espaço não separável entre R$ e o número
    expect(formatCurrency(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50')
  })
})

describe('getAmountError', () => {
  it('valida valores', () => {
    expect(getAmountError('')).toBeTruthy()
    expect(getAmountError('abc')).toBeTruthy()
    expect(getAmountError('-5')).toBeTruthy()
    expect(getAmountError('0')).toBeTruthy()
    expect(getAmountError('10.50')).toBeNull()
  })
})

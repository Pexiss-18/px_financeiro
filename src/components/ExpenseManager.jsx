import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowUpCircle, PlusCircle, Save, X } from 'lucide-react'
import RowActions from './RowActions'
import FieldError from './FieldError'
import { formatDateBR, getDefaultDateForMonth } from '../utils/date'
import { formatCurrency } from '../utils/format'
import { getAmountError, getDateError, getDescriptionError } from '../utils/validation'
import { EXPENSE_CATEGORIES as CATEGORIES } from '../data/categories'

function emptyForm(year, month) {
  return {
    description: '',
    amount: '',
    category: CATEGORIES[0],
    date: getDefaultDateForMonth(year, month),
  }
}

export default function ExpenseManager({ finance }) {
  const {
    filteredExpenses,
    totalExpenses,
    budget,
    setBudget,
    addExpense,
    editExpense,
    deleteExpense,
    budgetUsedPct,
    selectedYear,
    selectedMonth,
  } = finance
  const [form, setForm] = useState(() => emptyForm(selectedYear, selectedMonth))
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [budgetInput, setBudgetInput] = useState(String(budget))
  const [budgetError, setBudgetError] = useState(null)

  useEffect(() => {
    setEditingId(null)
    setConfirmingId(null)
    setErrors({})
    setForm(emptyForm(selectedYear, selectedMonth))
  }, [selectedYear, selectedMonth])

  // O orçamento é por mês: sincroniza o campo quando o mês (e portanto o valor) muda
  useEffect(() => {
    setBudgetInput(String(budget))
    setBudgetError(null)
  }, [budget])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: null }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = {
      description: getDescriptionError(form.description),
      amount: getAmountError(form.amount),
      date: getDateError(form.date),
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    if (editingId) {
      editExpense(editingId, { ...form, amount: parseFloat(form.amount) })
      setEditingId(null)
    } else {
      addExpense({ ...form, amount: parseFloat(form.amount) })
    }
    setForm(emptyForm(selectedYear, selectedMonth))
  }

  function handleBudgetSave(e) {
    e.preventDefault()
    const error = getAmountError(budgetInput)
    if (error) {
      setBudgetError(error)
      return
    }
    setBudgetError(null)
    setBudget(parseFloat(budgetInput))
  }

  function handleEditClick(expense) {
    setConfirmingId(null)
    setEditingId(expense.id)
    setErrors({})
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setErrors({})
    setForm(emptyForm(selectedYear, selectedMonth))
  }

  function handleConfirmDelete(id) {
    deleteExpense(id)
    setConfirmingId(null)
    if (editingId === id) handleCancelEdit()
  }

  const pctClamped = Math.min(budgetUsedPct, 100)
  const over = budgetUsedPct > 100
  const barColor = over ? 'bg-expense' : budgetUsedPct > 80 ? 'bg-amber-500' : 'bg-income'

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pretensão de Gastos (Orçamento Mensal)
            </p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(budget)}</p>
          </div>
          <form onSubmit={handleBudgetSave} className="flex items-start gap-2">
            <div>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={budgetInput}
                onChange={(e) => {
                  setBudgetInput(e.target.value)
                  setBudgetError(null)
                }}
                className="w-36 px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <FieldError message={budgetError} />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              Salvar
            </button>
          </form>
        </div>

        <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pctClamped}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {formatCurrency(totalExpenses)} gastos de {formatCurrency(budget)}
          </span>
          <span className={`font-semibold ${over ? 'text-expense' : 'text-slate-600 dark:text-slate-300'}`}>
            {Math.round(budgetUsedPct)}%
          </span>
        </div>
        {over && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-expense/10 text-expense text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Você ultrapassou o orçamento mensal definido.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 lg:col-span-1 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{editingId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                aria-label="Cancelar edição"
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Descrição"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-expense/50"
            />
            <FieldError message={errors.description} />
          </div>
          <div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Valor"
              value={form.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-expense/50"
            />
            <FieldError message={errors.amount} />
          </div>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-expense/50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
          <div>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-expense/50"
            />
            <FieldError message={errors.date} />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-expense to-rose-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            {editingId ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {editingId ? 'Salvar Alterações' : 'Adicionar Despesa'}
          </button>
        </form>

        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4">Histórico de Despesas</h3>
          {filteredExpenses.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Nenhuma despesa neste mês.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {filteredExpenses
                .slice()
                .reverse()
                .map((expense) => (
                  <div
                    key={expense.id}
                    className="group flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-expense/10 flex items-center justify-center">
                        <ArrowUpCircle className="w-4 h-4 text-expense" />
                      </div>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {expense.category} • {formatDateBR(expense.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-expense">-{formatCurrency(expense.amount)}</p>
                      <RowActions
                        confirming={confirmingId === expense.id}
                        onEdit={() => handleEditClick(expense)}
                        onDeleteClick={() => setConfirmingId(expense.id)}
                        onConfirmDelete={() => handleConfirmDelete(expense.id)}
                        onCancelDelete={() => setConfirmingId(null)}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

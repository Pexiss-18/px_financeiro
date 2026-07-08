import { useEffect, useState } from 'react'
import { ArrowDownCircle, PlusCircle, Save, X } from 'lucide-react'
import RowActions from './RowActions'
import FieldError from './FieldError'
import { formatDateBR, getDefaultDateForMonth } from '../utils/date'
import { formatCurrency } from '../utils/format'
import { getAmountError, getDateError, getDescriptionError } from '../utils/validation'
import { INCOME_CATEGORIES as CATEGORIES } from '../data/categories'

function emptyForm(year, month) {
  return {
    description: '',
    amount: '',
    category: CATEGORIES[0],
    date: getDefaultDateForMonth(year, month),
  }
}

export default function IncomeManager({ finance }) {
  const { filteredIncomes, totalIncome, addIncome, editIncome, deleteIncome, selectedYear, selectedMonth } =
    finance
  const [form, setForm] = useState(() => emptyForm(selectedYear, selectedMonth))
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)

  useEffect(() => {
    setEditingId(null)
    setConfirmingId(null)
    setErrors({})
    setForm(emptyForm(selectedYear, selectedMonth))
  }, [selectedYear, selectedMonth])

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
      editIncome(editingId, { ...form, amount: parseFloat(form.amount) })
      setEditingId(null)
    } else {
      addIncome({ ...form, amount: parseFloat(form.amount) })
    }
    setForm(emptyForm(selectedYear, selectedMonth))
  }

  function handleEditClick(income) {
    setConfirmingId(null)
    setEditingId(income.id)
    setErrors({})
    setForm({
      description: income.description,
      amount: String(income.amount),
      category: income.category,
      date: income.date,
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setErrors({})
    setForm(emptyForm(selectedYear, selectedMonth))
  }

  function handleConfirmDelete(id) {
    deleteIncome(id)
    setConfirmingId(null)
    if (editingId === id) handleCancelEdit()
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total de Receitas do Mês</p>
          <p className="text-3xl font-bold text-income mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-income/10 flex items-center justify-center">
          <ArrowDownCircle className="w-7 h-7 text-income" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 lg:col-span-1 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{editingId ? 'Editar Receita' : 'Nova Receita'}</h3>
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
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-income/50"
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
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-income/50"
            />
            <FieldError message={errors.amount} />
          </div>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-income/50"
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
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-income/50"
            />
            <FieldError message={errors.date} />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-income to-emerald-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            {editingId ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {editingId ? 'Salvar Alterações' : 'Adicionar Receita'}
          </button>
        </form>

        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4">Histórico de Receitas</h3>
          {filteredIncomes.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Nenhuma receita neste mês.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {filteredIncomes
                .slice()
                .reverse()
                .map((income) => (
                  <div
                    key={income.id}
                    className="group flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5"
                  >
                    <div>
                      <p className="font-medium">{income.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {income.category} • {formatDateBR(income.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-income">+{formatCurrency(income.amount)}</p>
                      <RowActions
                        confirming={confirmingId === income.id}
                        onEdit={() => handleEditClick(income)}
                        onDeleteClick={() => setConfirmingId(income.id)}
                        onConfirmDelete={() => handleConfirmDelete(income.id)}
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

import { useState } from 'react'
import { PlusCircle, Save, Sparkles, Target, X } from 'lucide-react'
import RowActions from './RowActions'
import FieldError from './FieldError'
import { formatCurrency } from '../utils/format'
import { getAmountError, getNameError } from '../utils/validation'

const PALETTE = ['#8b5cf6', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6']

function randomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

function emptyForm() {
  return { name: '', target: '' }
}

export default function InvestmentGoals({ finance }) {
  const { goals, totalInvested, totalInvestTarget, addGoal, editGoal, deleteGoal, addContribution } = finance
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [contributions, setContributions] = useState({})
  const [contributionErrors, setContributionErrors] = useState({})

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: null }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = {
      name: getNameError(form.name),
      target: getAmountError(form.target),
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    if (editingId) {
      editGoal(editingId, { name: form.name, target: parseFloat(form.target) })
      setEditingId(null)
    } else {
      addGoal({ name: form.name, target: parseFloat(form.target), color: randomColor() })
    }
    setForm(emptyForm())
  }

  function handleEditClick(goal) {
    setConfirmingId(null)
    setEditingId(goal.id)
    setErrors({})
    setForm({ name: goal.name, target: String(goal.target) })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setErrors({})
    setForm(emptyForm())
  }

  function handleConfirmDelete(id) {
    deleteGoal(id)
    setConfirmingId(null)
    if (editingId === id) handleCancelEdit()
  }

  function handleContribute(goalId) {
    const error = getAmountError(contributions[goalId])
    if (error) {
      setContributionErrors((prev) => ({ ...prev, [goalId]: error }))
      return
    }
    addContribution(goalId, parseFloat(contributions[goalId]))
    setContributions((prev) => ({ ...prev, [goalId]: '' }))
    setContributionErrors((prev) => ({ ...prev, [goalId]: null }))
  }

  const overallPct = totalInvestTarget > 0 ? Math.round((totalInvested / totalInvestTarget) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Investido</p>
          <p className="text-3xl font-bold text-invest mt-1">{formatCurrency(totalInvested)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            de {formatCurrency(totalInvestTarget)} em metas
          </p>
        </div>
        <div className="w-24 h-24 rounded-full border-8 border-invest/20 flex items-center justify-center">
          <span className="text-lg font-bold text-invest">{overallPct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 lg:col-span-1 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{editingId ? 'Editar Meta' : 'Nova Meta'}</h3>
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
              placeholder="Nome da meta"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-invest/50"
            />
            <FieldError message={errors.name} />
          </div>
          <div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Valor alvo"
              value={form.target}
              onChange={(e) => updateField('target', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-invest/50"
            />
            <FieldError message={errors.target} />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-invest to-purple-700 text-white font-medium hover:opacity-90 transition-opacity"
          >
            {editingId ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {editingId ? 'Salvar Alterações' : 'Criar Meta'}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {goals.map((goal) => {
            const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100)
            const reached = goal.current >= goal.target
            return (
              <div key={goal.id} className="group glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${goal.color}1A` }}
                    >
                      {reached ? (
                        <Sparkles className="w-5 h-5" style={{ color: goal.color }} />
                      ) : (
                        <Target className="w-5 h-5" style={{ color: goal.color }} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{goal.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatCurrency(goal.current)} de {formatCurrency(goal.target)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold" style={{ color: reached ? '#22c55e' : goal.color }}>
                      {pct}%
                    </span>
                    <RowActions
                      confirming={confirmingId === goal.id}
                      onEdit={() => handleEditClick(goal)}
                      onDeleteClick={() => setConfirmingId(goal.id)}
                      onConfirmDelete={() => handleConfirmDelete(goal.id)}
                      onCancelDelete={() => setConfirmingId(null)}
                    />
                  </div>
                </div>
                <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: reached ? '#22c55e' : goal.color }}
                  />
                </div>
                <div className="flex items-start gap-2 mt-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Adicionar aporte"
                      value={contributions[goal.id] || ''}
                      onChange={(e) => {
                        setContributions({ ...contributions, [goal.id]: e.target.value })
                        setContributionErrors({ ...contributionErrors, [goal.id]: null })
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-invest/50"
                    />
                    <FieldError message={contributionErrors[goal.id]} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleContribute(goal.id)}
                    className="px-4 py-2 rounded-xl bg-invest/10 text-invest text-sm font-semibold hover:bg-invest/20 transition-colors"
                  >
                    Aportar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

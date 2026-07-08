import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import FieldError from './FieldError'

// Painel de adicionar/remover categorias; onAdd/onRemove devolvem uma
// mensagem de erro ou null (contrato de addCategory/removeCategory do hook)
export default function CategoryManager({ categories, onAdd, onRemove }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  function handleAdd() {
    const err = onAdd(name)
    setError(err)
    if (!err) setName('')
  }

  return (
    <div className="rounded-xl bg-white/40 dark:bg-white/5 p-3 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/60 dark:bg-white/10 text-xs font-medium"
          >
            {cat}
            <button
              type="button"
              aria-label={`Remover categoria ${cat}`}
              onClick={() => setError(onRemove(cat))}
              className="text-slate-400 hover:text-expense transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nova categoria"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
        <button
          type="button"
          onClick={handleAdd}
          aria-label="Adicionar categoria"
          className="w-8 h-8 shrink-0 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <FieldError message={error} />
    </div>
  )
}

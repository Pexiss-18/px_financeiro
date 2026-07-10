import { Check, Pencil, Trash2, X } from 'lucide-react'

export default function RowActions({ confirming, onEdit, onDeleteClick, onConfirmDelete, onCancelDelete }) {
  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Excluir?</span>
        <button
          type="button"
          onClick={onConfirmDelete}
          aria-label="Confirmar exclusão"
          className="w-7 h-7 rounded-lg bg-expense/10 text-expense flex items-center justify-center hover:bg-expense/20 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancelDelete}
          aria-label="Cancelar exclusão"
          className="w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300/60 dark:hover:bg-white/20 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    // Em telas de toque não existe hover: os botões ficam sempre visíveis;
    // o esconde/mostra só se aplica a dispositivos com ponteiro (mouse)
    <div className="flex items-center gap-1.5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Editar"
        className="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 flex items-center justify-center transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onDeleteClick}
        aria-label="Excluir"
        className="w-7 h-7 rounded-lg text-slate-400 hover:text-expense hover:bg-expense/10 flex items-center justify-center transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

import { Cloud, LogOut, User } from 'lucide-react'
import { AuthForm, ConflictChooser, ErrorText, PanelText, PassphraseForm } from './AccountForms'

const STATUS_LABELS = {
  idle: 'Aguardando',
  syncing: 'Sincronizando...',
  synced: 'Sincronizado',
  error: 'Erro de sincronização',
}

const STATUS_DOTS = {
  idle: 'bg-slate-400',
  syncing: 'bg-amber-400',
  synced: 'bg-income',
  error: 'bg-expense',
}

// Painel de quem já está logado e com a frase destravada.
function StatusPanel({ sync }) {
  async function handleSignOut() {
    const ok = window.confirm('Sair da conta? Seus dados continuam salvos neste aparelho e na nuvem.')
    if (!ok) return
    await sync.signOut()
  }

  return (
    <div className="space-y-2 px-1 pb-2">
      <p className="px-1 text-sm font-medium break-all">{sync.user.email}</p>
      <p className="flex items-center gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <span className={`w-2 h-2 rounded-full ${STATUS_DOTS[sync.syncStatus]}`} aria-hidden="true" />
        {STATUS_LABELS[sync.syncStatus]}
      </p>
      {sync.syncError && <ErrorText>{sync.syncError}</ErrorText>}
      <PanelText>
        Seus dados sobem criptografados de ponta a ponta — só quem tem a frase-secreta consegue lê-los.
      </PanelText>
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg text-expense hover:bg-expense/10 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sair da conta
      </button>
    </div>
  )
}

function PanelContent({ sync }) {
  if (!sync.configured) {
    return (
      <PanelText>
        A sincronização entre aparelhos ainda não foi configurada nesta instalação. Veja o passo a passo no
        arquivo CONFIGURAR-NUVEM.md do projeto.
      </PanelText>
    )
  }
  if (sync.authLoading) return <PanelText>Conectando...</PanelText>
  if (!sync.user) return <AuthForm sync={sync} />
  if (sync.conflict) return <ConflictChooser sync={sync} />
  if (!sync.hasKey) {
    if (sync.cloudDoc === undefined) return <PanelText>Verificando seus dados na nuvem...</PanelText>
    return <PassphraseForm sync={sync} />
  }
  return <StatusPanel sync={sync} />
}

export default function AccountMenu({ sync, open, onToggle, onClose }) {
  const loggedAndReady = Boolean(sync.user && sync.hasKey)
  const needsAttention = Boolean(
    sync.configured && (sync.syncStatus === 'error' || (sync.user && !sync.hasKey) || sync.conflict)
  )
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          sync.activate()
          onToggle()
        }}
        aria-label="Conta e sincronização"
        title="Conta e sincronização"
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-card flex items-center justify-center hover:scale-105 transition-transform"
      >
        {loggedAndReady ? <Cloud className="w-5 h-5" /> : <User className="w-5 h-5" />}
        {(loggedAndReady || needsAttention) && (
          <span
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              needsAttention ? 'bg-expense' : STATUS_DOTS[sync.syncStatus]
            }`}
            aria-hidden="true"
          />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
          <div className="absolute right-0 top-12 z-50 w-72 glass-card p-2 shadow-xl bg-white/90 dark:bg-slate-900/90">
            <p className="px-3 py-2 text-sm font-semibold">Conta e sincronização</p>
            <div className="px-2">
              <PanelContent sync={sync} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

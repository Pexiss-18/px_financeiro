import { useEffect } from 'react'
import { CloudOff, RefreshCw, ShieldCheck, Wallet } from 'lucide-react'
import { AuthForm, ConflictChooser, PanelText, PassphraseForm } from './AccountForms'

function Benefit({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-violet-500 dark:text-violet-400" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

function Step({ sync }) {
  if (sync.authLoading) return <PanelText>Conectando...</PanelText>
  if (!sync.user) return <AuthForm sync={sync} />
  if (sync.conflict) return <ConflictChooser sync={sync} />
  if (!sync.hasKey) {
    if (sync.cloudDoc === undefined) return <PanelText>Verificando seus dados na nuvem...</PanelText>
    return <PassphraseForm sync={sync} />
  }
  return <PanelText>Tudo pronto! Abrindo o app...</PanelText>
}

// Tela inicial de boas-vindas: entrar/criar conta ou seguir sem conta.
// Aparece na primeira visita (e em aparelhos novos até destravar a frase);
// depois disso o app abre direto e a conta fica no menu da barra superior.
export default function LoginScreen({ sync, onSkip }) {
  // Carrega o Firebase assim que a tela aparece — o login depende dele.
  const { activate } = sync
  useEffect(() => {
    activate()
  }, [activate])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="w-full max-w-sm">
        <header className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-3">
            <Wallet className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FinanPro</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Suas finanças em todos os seus aparelhos
          </p>
        </header>

        <div className="glass-card p-4 sm:p-5 bg-white/70 dark:bg-slate-900/70 shadow-xl">
          <Step sync={sync} />
        </div>

        {!sync.user && (
          <ul className="mt-6 space-y-2.5 px-1">
            <Benefit icon={RefreshCw}>Lançamentos, orçamentos e metas sincronizados automaticamente</Benefit>
            <Benefit icon={ShieldCheck}>
              Criptografia de ponta a ponta: só você consegue ler seus dados
            </Benefit>
            <Benefit icon={CloudOff}>Funciona offline — a nuvem é opcional</Benefit>
          </ul>
        )}

        <button
          type="button"
          onClick={onSkip}
          className="w-full mt-6 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
        >
          {sync.user ? 'Continuar sem sincronizar agora →' : 'Usar sem conta →'}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
          Sem conta, seus dados ficam somente neste aparelho — e você pode criar a conta depois, no menu do
          app.
        </p>
      </main>
    </div>
  )
}

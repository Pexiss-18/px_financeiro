import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'

// Formulários de conta compartilhados entre a tela inicial de login
// (LoginScreen) e o menu Conta da barra superior (AccountMenu).

const inputClasses =
  'w-full px-3 py-2 text-base sm:text-sm rounded-lg bg-white/60 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400'

const primaryButtonClasses =
  'w-full px-3 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50'

const linkButtonClasses =
  'w-full px-3 py-1.5 text-xs text-indigo-500 dark:text-indigo-300 hover:underline text-center'

export function PanelText({ children }) {
  return <p className="px-1 pb-2 text-xs text-slate-500 dark:text-slate-400">{children}</p>
}

export function ErrorText({ children }) {
  if (!children) return null
  return <p className="px-1 py-1 text-xs text-expense">{children}</p>
}

// Login/criação de conta (Firebase Auth, e-mail e senha).
export function AuthForm({ sync }) {
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!email.trim()) return setError('Informe seu e-mail.')
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.')
    if (mode === 'signup' && password !== confirm) return setError('As senhas não conferem.')
    setBusy(true)
    try {
      if (mode === 'signup') await sync.signUp(email, password)
      else await sync.signIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot() {
    setError(null)
    setInfo(null)
    if (!email.trim()) return setError('Digite seu e-mail acima e toque em "Esqueci a senha".')
    try {
      await sync.sendReset(email)
      setInfo('Enviamos um link de redefinição para o seu e-mail.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 px-1 pb-2">
      <PanelText>
        {mode === 'signup'
          ? 'Crie uma conta para acessar seus dados em qualquer aparelho.'
          : 'Entre para sincronizar seus dados entre aparelhos.'}
      </PanelText>
      <input
        type="email"
        autoComplete="email"
        placeholder="E-mail"
        aria-label="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClasses}
      />
      <input
        type="password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        placeholder="Senha"
        aria-label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClasses}
      />
      {mode === 'signup' && (
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Confirmar senha"
          aria-label="Confirmar senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClasses}
        />
      )}
      <ErrorText>{error}</ErrorText>
      {info && <p className="px-1 py-1 text-xs text-income">{info}</p>}
      <button type="submit" disabled={busy} className={primaryButtonClasses}>
        {busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signup' ? 'signin' : 'signup')
          setError(null)
          setInfo(null)
        }}
        className={linkButtonClasses}
      >
        {mode === 'signup' ? 'Já tenho conta — entrar' : 'Não tenho conta — criar'}
      </button>
      {mode === 'signin' && (
        <button type="button" onClick={handleForgot} className={linkButtonClasses}>
          Esqueci a senha
        </button>
      )}
    </form>
  )
}

// Criação da frase-secreta (primeiro aparelho) ou destravamento (aparelho novo).
export function PassphraseForm({ sync }) {
  const creating = sync.cloudDoc === null
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (creating) {
      if (passphrase.length < 8) return setError('Use pelo menos 8 caracteres.')
      if (passphrase !== confirm) return setError('As frases não conferem.')
    } else if (!passphrase) {
      return setError('Digite sua frase-secreta.')
    }
    setBusy(true)
    try {
      if (creating) await sync.createPassphrase(passphrase)
      else await sync.unlock(passphrase)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassphrase() {
    const ok = window.confirm(
      'Sem a frase-secreta, os dados na nuvem não podem ser lidos por ninguém — nem por você.\n\n' +
        'A única saída é criar uma frase nova e SUBSTITUIR a nuvem pelos dados DESTE aparelho. ' +
        'O que estiver apenas na nuvem será perdido.\n\nContinuar?'
    )
    if (!ok) return
    const newPassphrase = window.prompt('Nova frase-secreta (mínimo 8 caracteres):')
    if (!newPassphrase) return
    if (newPassphrase.length < 8) {
      setError('Use pelo menos 8 caracteres.')
      return
    }
    setBusy(true)
    try {
      await sync.overwriteCloudWithLocal(newPassphrase)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 px-1 pb-2">
      <div className="flex items-start gap-2 px-1 pb-1">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-income" aria-hidden="true" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {creating
            ? 'Crie uma frase-secreta: ela criptografa seus dados no aparelho antes de subir. Nem o servidor consegue lê-los. Guarde-a bem — se você a esquecer, ninguém recupera os dados da nuvem.'
            : 'Digite a frase-secreta criada no seu outro aparelho para destravar seus dados.'}
        </p>
      </div>
      <input
        type="password"
        autoComplete="off"
        placeholder="Frase-secreta"
        aria-label="Frase-secreta"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        className={inputClasses}
      />
      {creating && (
        <input
          type="password"
          autoComplete="off"
          placeholder="Confirmar frase-secreta"
          aria-label="Confirmar frase-secreta"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClasses}
        />
      )}
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={busy} className={primaryButtonClasses}>
        {busy ? 'Aguarde...' : creating ? 'Ativar sincronização' : 'Destravar'}
      </button>
      {!creating && (
        <button type="button" onClick={handleForgotPassphrase} className={linkButtonClasses}>
          Esqueci a frase-secreta
        </button>
      )}
    </form>
  )
}

// Nuvem e aparelho têm versões diferentes: o usuário escolhe qual manter.
export function ConflictChooser({ sync }) {
  const { conflict } = sync
  const formatStamp = (ts) =>
    ts > 0 ? new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
  const cloudNewer = conflict.cloudUpdatedAt > conflict.localUpdatedAt
  return (
    <div className="space-y-2 px-1 pb-2">
      <PanelText>
        Este aparelho e a nuvem têm dados diferentes. Qual versão você quer manter? A outra será substituída
        em todos os aparelhos.
      </PanelText>
      <button type="button" onClick={() => sync.resolveConflict('cloud')} className={primaryButtonClasses}>
        Usar dados da nuvem ({formatStamp(conflict.cloudUpdatedAt)}){cloudNewer ? ' — mais recentes' : ''}
      </button>
      <button
        type="button"
        onClick={() => sync.resolveConflict('local')}
        className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-indigo-400/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
      >
        Usar dados deste aparelho ({formatStamp(conflict.localUpdatedAt)})
        {cloudNewer ? '' : ' — mais recentes'}
      </button>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebaseConfig'
import {
  saveCloudDoc,
  sendPasswordReset,
  signIn,
  signOutUser,
  signUp,
  watchAuth,
  watchCloudDoc,
} from '../lib/cloud'
import {
  decryptJson,
  deriveKey,
  encryptJson,
  exportKey,
  generateSalt,
  importKey,
  parseEnvelope,
} from '../utils/crypto'

// Estado da sincronização guardado por aparelho: a qual usuário a chave em
// cache pertence, o salt usado na derivação e a própria chave AES exportada.
const SYNC_KEY = 'px-financeiro:sync'

function readSyncState() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_KEY)) ?? null
  } catch {
    return null
  }
}

function writeSyncState(state) {
  try {
    if (state) localStorage.setItem(SYNC_KEY, JSON.stringify(state))
    else localStorage.removeItem(SYNC_KEY)
  } catch {
    // sem localStorage não há como manter a sessão de sincronização
  }
}

// Sincroniza os dados locais com a nuvem (Firebase) usando "última escrita
// vence": cada versão dos dados carrega o carimbo dataUpdatedAt e o documento
// na nuvem guarda o carimbo da última versão enviada. Tudo o que sobe é
// criptografado no aparelho com a chave derivada da frase-secreta.
//
// Estados relevantes para a UI:
//   configured=false  → falta preencher firebaseConfig.js
//   user=null         → deslogado (formulário de login)
//   user && !key      → logado, falta a frase-secreta (criar ou destravar)
//   conflict          → nuvem e aparelho têm dados diferentes; usuário escolhe
//   syncStatus        → idle | syncing | synced | error
export function useCloudSync(finance) {
  const { dataUpdatedAt, exportData, applyRemoteData, touchData } = finance

  const [activated, setActivated] = useState(() => isFirebaseConfigured && readSyncState() !== null)
  const [authLoading, setAuthLoading] = useState(activated)
  const [user, setUser] = useState(null)
  const [key, setKey] = useState(null) // CryptoKey em memória
  const [salt, setSalt] = useState(null)
  // undefined = ainda carregando; null = nuvem vazia; objeto = { envelope, updatedAt }
  const [cloudDoc, setCloudDoc] = useState(undefined)
  const [conflict, setConflict] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncError, setSyncError] = useState(null)
  const [retryTick, setRetryTick] = useState(0)

  // Refs para usar os valores mais recentes dentro de callbacks assíncronos
  // sem recriar efeitos. Atualizadas no primeiro efeito de cada commit, antes
  // de qualquer outro efeito rodar.
  const saltRef = useRef(null)
  const dataUpdatedAtRef = useRef(dataUpdatedAt)
  const exportDataRef = useRef(exportData)
  const applyRemoteRef = useRef(applyRemoteData)
  const touchDataRef = useRef(touchData)
  useEffect(() => {
    saltRef.current = salt
    dataUpdatedAtRef.current = dataUpdatedAt
    exportDataRef.current = exportData
    applyRemoteRef.current = applyRemoteData
    touchDataRef.current = touchData
  })

  // Chamado quando o usuário abre o menu Conta pela primeira vez — só então
  // o chunk do Firebase é baixado.
  const activate = useCallback(() => {
    if (!isFirebaseConfigured || activated) return
    setAuthLoading(true)
    setActivated(true)
  }, [activated])

  // Observa o login/logout.
  useEffect(() => {
    if (!activated) return
    let unsubscribe = null
    let cancelled = false
    watchAuth(async (firebaseUser) => {
      if (cancelled) return
      if (!firebaseUser) {
        setUser(null)
        setKey(null)
        setSalt(null)
        setCloudDoc(undefined)
        setConflict(null)
        setSyncStatus('idle')
        setAuthLoading(false)
        return
      }
      // Reaproveita a chave em cache se pertencer a este usuário.
      const storedState = readSyncState()
      if (storedState?.uid === firebaseUser.uid && storedState.key) {
        try {
          const cachedKey = await importKey(storedState.key)
          if (cancelled) return
          setKey(cachedKey)
          setSalt(storedState.salt)
        } catch {
          writeSyncState(null)
        }
      }
      if (cancelled) return
      setUser({ uid: firebaseUser.uid, email: firebaseUser.email })
      setAuthLoading(false)
    })
      .then((stop) => {
        unsubscribe = stop
        if (cancelled) stop()
      })
      .catch((error) => {
        console.error('Falha ao iniciar a autenticação:', error)
        if (!cancelled) {
          setAuthLoading(false)
          setSyncError('Não foi possível conectar ao serviço de login.')
        }
      })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [activated])

  // Observa o documento do usuário na nuvem (mudanças feitas em outro aparelho).
  useEffect(() => {
    if (!user) return
    let unsubscribe = null
    let cancelled = false
    watchCloudDoc(user.uid, (remote, error) => {
      if (cancelled) return
      if (error) {
        setSyncStatus('error')
        setSyncError('Sem acesso à nuvem no momento. Seus dados continuam salvos neste aparelho.')
        return
      }
      setCloudDoc(remote)
    }).then((stop) => {
      unsubscribe = stop
      if (cancelled) stop()
    })
    return () => {
      cancelled = true
      unsubscribe?.()
      setCloudDoc(undefined)
    }
  }, [user])

  // Aplica ao aparelho uma versão mais recente vinda da nuvem.
  useEffect(() => {
    if (!key || !cloudDoc || conflict) return
    if (cloudDoc.updatedAt <= dataUpdatedAtRef.current) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await decryptJson(key, cloudDoc.envelope)
        if (cancelled) return
        applyRemoteRef.current(data, cloudDoc.updatedAt)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (error) {
        if (cancelled) return
        // A chave em cache não abre mais o envelope — a frase-secreta foi
        // trocada em outro aparelho. Pede a nova frase.
        console.error('Falha ao aplicar dados da nuvem:', error)
        writeSyncState(null)
        setKey(null)
        setSalt(null)
        setSyncStatus('error')
        setSyncError('A frase-secreta foi alterada em outro aparelho. Digite a nova frase.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [key, cloudDoc, conflict])

  // Envia para a nuvem quando os dados locais são os mais recentes.
  useEffect(() => {
    if (!user || !key || conflict || cloudDoc === undefined) return
    const cloudUpdatedAt = cloudDoc?.updatedAt ?? 0
    if (dataUpdatedAt <= cloudUpdatedAt) {
      if (cloudUpdatedAt > 0) {
        setSyncStatus('synced')
        setSyncError(null)
      }
      return
    }
    if (dataUpdatedAt === 0) return // dados de exemplo intocados e nuvem vazia
    setSyncStatus('syncing')
    // Debounce: agrupa edições em sequência em um único envio.
    const uid = user.uid
    const timer = setTimeout(async () => {
      try {
        const envelope = await encryptJson(key, saltRef.current, exportDataRef.current())
        await saveCloudDoc(uid, envelope, dataUpdatedAt)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (error) {
        console.error('Falha ao enviar dados para a nuvem:', error)
        setSyncStatus('error')
        setSyncError('Não foi possível enviar os dados. Eles continuam salvos neste aparelho.')
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [user, key, conflict, cloudDoc, dataUpdatedAt, retryTick])

  // Ao voltar a ficar online, tenta enviar de novo o que ficou pendente.
  useEffect(() => {
    const onOnline = () => setRetryTick((tick) => tick + 1)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  const doSignUp = useCallback(async (email, password) => {
    await signUp(email.trim(), password)
  }, [])

  const doSignIn = useCallback(async (email, password) => {
    await signIn(email.trim(), password)
  }, [])

  const doSendReset = useCallback(async (email) => {
    await sendPasswordReset(email.trim())
  }, [])

  const doSignOut = useCallback(async () => {
    await signOutUser()
    writeSyncState(null)
  }, [])

  // Primeira frase-secreta (nuvem vazia): cria a chave e sobe os dados locais.
  const createPassphrase = useCallback(
    async (passphrase) => {
      const newSalt = generateSalt()
      const derived = await deriveKey(passphrase, newSalt)
      writeSyncState({ uid: user.uid, salt: newSalt, key: await exportKey(derived) })
      setSalt(newSalt)
      setKey(derived)
      // Garante um carimbo > 0 para que o efeito de envio dispare.
      touchDataRef.current()
    },
    [user]
  )

  // Destrava a sincronização em um aparelho novo: valida a frase contra o
  // envelope da nuvem e decide qual lado prevalece.
  const unlock = useCallback(
    async (passphrase) => {
      const envelope = parseEnvelope(cloudDoc.envelope)
      const derived = await deriveKey(passphrase, envelope.salt)
      const data = await decryptJson(derived, cloudDoc.envelope) // lança se a frase estiver errada
      writeSyncState({ uid: user.uid, salt: envelope.salt, key: await exportKey(derived) })
      setSalt(envelope.salt)
      const localUpdatedAt = dataUpdatedAtRef.current
      if (localUpdatedAt > 0 && localUpdatedAt !== cloudDoc.updatedAt) {
        // Os dois lados têm dados: o usuário escolhe qual manter.
        setConflict({
          localUpdatedAt,
          cloudUpdatedAt: cloudDoc.updatedAt,
          data,
        })
        setKey(derived)
        return
      }
      applyRemoteRef.current(data, cloudDoc.updatedAt)
      setKey(derived)
      setSyncStatus('synced')
      setSyncError(null)
    },
    [cloudDoc, user]
  )

  // Frase esquecida: cria uma frase nova e SUBSTITUI a nuvem pelos dados
  // deste aparelho (a UI confirma antes, pois descarta o que está na nuvem).
  const overwriteCloudWithLocal = useCallback(
    async (passphrase) => {
      const newSalt = generateSalt()
      const derived = await deriveKey(passphrase, newSalt)
      writeSyncState({ uid: user.uid, salt: newSalt, key: await exportKey(derived) })
      setSalt(newSalt)
      setKey(derived)
      setConflict(null)
      touchDataRef.current((cloudDoc?.updatedAt ?? 0) + 1)
    },
    [user, cloudDoc]
  )

  const resolveConflict = useCallback(
    (choice) => {
      if (!conflict) return
      setConflict(null)
      if (choice === 'cloud') {
        applyRemoteRef.current(conflict.data, conflict.cloudUpdatedAt)
        setSyncStatus('synced')
        setSyncError(null)
      } else {
        // Reaplica os dados locais com carimbo mais novo que o da nuvem —
        // o efeito de envio faz o upload.
        touchDataRef.current(conflict.cloudUpdatedAt + 1)
      }
    },
    [conflict]
  )

  return {
    configured: isFirebaseConfigured,
    activated,
    activate,
    authLoading,
    user,
    hasKey: key !== null,
    cloudDoc,
    conflict,
    syncStatus,
    syncError,
    signUp: doSignUp,
    signIn: doSignIn,
    signOut: doSignOut,
    sendReset: doSendReset,
    createPassphrase,
    unlock,
    overwriteCloudWithLocal,
    resolveConflict,
  }
}

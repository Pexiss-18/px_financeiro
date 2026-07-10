// Camada de acesso ao Firebase (Auth + Firestore).
//
// O SDK é pesado, então é carregado dinamicamente (chunk separado) apenas
// quando o usuário abre o menu Conta ou já usou a sincronização neste
// aparelho — quem não usa conta continua baixando o mesmo bundle de antes.
//
// Modelo de dados na nuvem: um único documento por usuário em
// `users/{uid}` com { envelope, updatedAt }, onde `envelope` é o JSON
// criptografado no aparelho (ver utils/crypto.js) e `updatedAt` é o carimbo
// (ms) da última alteração local — usado no "última escrita vence".
import { firebaseConfig } from './firebaseConfig'

let modulesPromise = null

async function loadFirebase() {
  if (!modulesPromise) {
    modulesPromise = (async () => {
      const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ])
      const app = initializeApp(firebaseConfig)
      return {
        auth: authModule.getAuth(app),
        db: firestoreModule.getFirestore(app),
        authModule,
        firestoreModule,
      }
    })()
  }
  return modulesPromise
}

const AUTH_ERRORS = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'Não existe conta com este e-mail.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com o servidor. Verifique sua internet.',
}

function translateAuthError(error) {
  return AUTH_ERRORS[error?.code] ?? 'Não foi possível completar a operação. Tente novamente.'
}

export async function watchAuth(callback) {
  const { auth, authModule } = await loadFirebase()
  return authModule.onAuthStateChanged(auth, callback)
}

export async function signUp(email, password) {
  const { auth, authModule } = await loadFirebase()
  try {
    const result = await authModule.createUserWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    throw new Error(translateAuthError(error))
  }
}

export async function signIn(email, password) {
  const { auth, authModule } = await loadFirebase()
  try {
    const result = await authModule.signInWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    throw new Error(translateAuthError(error))
  }
}

export async function sendPasswordReset(email) {
  const { auth, authModule } = await loadFirebase()
  try {
    await authModule.sendPasswordResetEmail(auth, email)
  } catch (error) {
    throw new Error(translateAuthError(error))
  }
}

export async function signOutUser() {
  const { auth, authModule } = await loadFirebase()
  await authModule.signOut(auth)
}

function userDocRef(firestoreModule, db, uid) {
  return firestoreModule.doc(db, 'users', uid)
}

export async function fetchCloudDoc(uid) {
  const { db, firestoreModule } = await loadFirebase()
  const snapshot = await firestoreModule.getDoc(userDocRef(firestoreModule, db, uid))
  return snapshot.exists() ? snapshot.data() : null
}

export async function saveCloudDoc(uid, envelope, updatedAt) {
  const { db, firestoreModule } = await loadFirebase()
  await firestoreModule.setDoc(userDocRef(firestoreModule, db, uid), { envelope, updatedAt })
}

// Escuta mudanças no documento do usuário (outro aparelho salvou algo).
export async function watchCloudDoc(uid, callback) {
  const { db, firestoreModule } = await loadFirebase()
  return firestoreModule.onSnapshot(
    userDocRef(firestoreModule, db, uid),
    (snapshot) => callback(snapshot.exists() ? snapshot.data() : null),
    (error) => {
      console.error('Falha ao escutar dados na nuvem:', error)
      callback(null, error)
    }
  )
}

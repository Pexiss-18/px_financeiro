// Criptografia ponta a ponta dos dados sincronizados.
//
// A frase-secreta do usuário nunca sai do aparelho: dela deriva-se uma chave
// AES-256 (PBKDF2 + SHA-256) que criptografa o JSON completo antes do upload.
// Na nuvem só chega um "envelope" com salt, IV e o texto cifrado — ilegível
// sem a frase. O salt viaja no envelope para que outro aparelho consiga
// derivar a mesma chave a partir da frase digitada.

const PBKDF2_ITERATIONS = 310000
const ENVELOPE_VERSION = 1

function subtle() {
  const subtleCrypto = globalThis.crypto?.subtle
  if (!subtleCrypto) {
    throw new Error('Este navegador não suporta criptografia (WebCrypto indisponível).')
  }
  return subtleCrypto
}

function toBase64(bytes) {
  let binary = ''
  const array = new Uint8Array(bytes)
  for (let i = 0; i < array.length; i++) binary += String.fromCharCode(array[i])
  return btoa(binary)
}

function fromBase64(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function generateSalt() {
  const salt = new Uint8Array(16)
  globalThis.crypto.getRandomValues(salt)
  return toBase64(salt)
}

export async function deriveKey(passphrase, saltBase64) {
  const material = await subtle().importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return subtle().deriveKey(
    { name: 'PBKDF2', salt: fromBase64(saltBase64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

// A chave derivada fica guardada no aparelho (base64) para não pedir a frase
// a cada uso — o aparelho já guarda os dados em claro no localStorage, então
// isso não enfraquece a proteção dos dados na nuvem.
export async function exportKey(key) {
  return toBase64(await subtle().exportKey('raw', key))
}

export async function importKey(rawBase64) {
  return subtle().importKey('raw', fromBase64(rawBase64), { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ])
}

export async function encryptJson(key, saltBase64, data) {
  const iv = new Uint8Array(12)
  globalThis.crypto.getRandomValues(iv)
  const plaintext = new TextEncoder().encode(JSON.stringify(data))
  const ciphertext = await subtle().encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return JSON.stringify({
    v: ENVELOPE_VERSION,
    salt: saltBase64,
    iv: toBase64(iv),
    data: toBase64(ciphertext),
  })
}

export function parseEnvelope(envelopeJson) {
  try {
    const envelope = JSON.parse(envelopeJson)
    if (envelope?.v === ENVELOPE_VERSION && envelope.salt && envelope.iv && envelope.data) {
      return envelope
    }
  } catch {
    // envelope corrompido — tratado abaixo
  }
  throw new Error('Os dados na nuvem estão em um formato desconhecido.')
}

export async function decryptJson(key, envelopeJson) {
  const envelope = parseEnvelope(envelopeJson)
  try {
    const plaintext = await subtle().decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.data)
    )
    return JSON.parse(new TextDecoder().decode(plaintext))
  } catch {
    throw new Error('Frase-secreta incorreta.')
  }
}

import { beforeAll, describe, expect, it } from 'vitest'
import { webcrypto } from 'node:crypto'
import {
  decryptJson,
  deriveKey,
  encryptJson,
  exportKey,
  generateSalt,
  importKey,
  parseEnvelope,
} from './crypto'

// O jsdom não traz WebCrypto completo; usamos a implementação do Node.
beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
  }
})

const SAMPLE = { incomes: [{ id: '1', amount: 100.5 }], categories: { income: ['Salário'] } }

describe('crypto (ponta a ponta)', () => {
  it('criptografa e descriptografa preservando os dados (inclusive acentos)', async () => {
    const salt = generateSalt()
    const key = await deriveKey('minha frase secreta', salt)
    const envelope = await encryptJson(key, salt, SAMPLE)
    expect(await decryptJson(key, envelope)).toEqual(SAMPLE)
  })

  it('não expõe o conteúdo no envelope', async () => {
    const salt = generateSalt()
    const key = await deriveKey('minha frase secreta', salt)
    const envelope = await encryptJson(key, salt, SAMPLE)
    expect(envelope).not.toContain('Salário')
    expect(envelope).not.toContain('100.5')
  })

  it('recusa a frase-secreta errada', async () => {
    const salt = generateSalt()
    const key = await deriveKey('frase certa', salt)
    const envelope = await encryptJson(key, salt, SAMPLE)
    const wrongKey = await deriveKey('frase errada', salt)
    await expect(decryptJson(wrongKey, envelope)).rejects.toThrow(/frase-secreta incorreta/i)
  })

  it('deriva a mesma chave em outro "aparelho" a partir da frase e do salt do envelope', async () => {
    const salt = generateSalt()
    const deviceA = await deriveKey('mesma frase', salt)
    const envelope = await encryptJson(deviceA, salt, SAMPLE)
    // aparelho novo: lê o salt do envelope e deriva a chave só com a frase
    const parsed = parseEnvelope(envelope)
    const deviceB = await deriveKey('mesma frase', parsed.salt)
    expect(await decryptJson(deviceB, envelope)).toEqual(SAMPLE)
  })

  it('exporta e reimporta a chave (cache local do aparelho)', async () => {
    const salt = generateSalt()
    const key = await deriveKey('minha frase', salt)
    const envelope = await encryptJson(key, salt, SAMPLE)
    const restored = await importKey(await exportKey(key))
    expect(await decryptJson(restored, envelope)).toEqual(SAMPLE)
  })

  it('rejeita envelopes corrompidos ou de formato desconhecido', () => {
    expect(() => parseEnvelope('não é json')).toThrow(/formato desconhecido/i)
    expect(() => parseEnvelope('{"v":99}')).toThrow(/formato desconhecido/i)
  })

  it('gera salts diferentes a cada chamada', () => {
    expect(generateSalt()).not.toBe(generateSalt())
  })
})

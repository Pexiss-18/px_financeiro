import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LoginScreen from './LoginScreen'

const baseSync = {
  configured: true,
  activated: true,
  activate: vi.fn(),
  authLoading: false,
  user: null,
  hasKey: false,
  cloudDoc: undefined,
  conflict: null,
  syncStatus: 'idle',
  syncError: null,
}

function renderScreen(overrides = {}, onSkip = vi.fn()) {
  const sync = { ...baseSync, activate: vi.fn(), ...overrides }
  render(<LoginScreen sync={sync} onSkip={onSkip} />)
  return { sync, onSkip }
}

describe('LoginScreen', () => {
  it('mostra a marca, o formulário de login e os benefícios quando deslogado', () => {
    renderScreen()
    expect(screen.getByText('FinanPro')).toBeTruthy()
    expect(screen.getByLabelText('E-mail')).toBeTruthy()
    expect(screen.getByText(/criptografia de ponta a ponta/i)).toBeTruthy()
    expect(screen.getByText('Usar sem conta →')).toBeTruthy()
  })

  it('ativa o carregamento do Firebase ao aparecer', () => {
    const { sync } = renderScreen()
    expect(sync.activate).toHaveBeenCalled()
  })

  it('chama onSkip ao escolher "usar sem conta"', () => {
    const { onSkip } = renderScreen()
    fireEvent.click(screen.getByText('Usar sem conta →'))
    expect(onSkip).toHaveBeenCalled()
  })

  it('avança para a frase-secreta depois do login', () => {
    renderScreen({ user: { uid: 'u1', email: 'a@b.c' }, cloudDoc: null })
    expect(screen.getByText(/crie uma frase-secreta/i)).toBeTruthy()
    // logado, o atalho vira "continuar sem sincronizar"
    expect(screen.getByText('Continuar sem sincronizar agora →')).toBeTruthy()
  })

  it('mostra o conflito quando nuvem e aparelho divergem', () => {
    renderScreen({
      user: { uid: 'u1', email: 'a@b.c' },
      hasKey: true,
      conflict: { localUpdatedAt: 2000, cloudUpdatedAt: 1000, data: {} },
    })
    expect(screen.getByText(/usar dados da nuvem/i)).toBeTruthy()
  })
})

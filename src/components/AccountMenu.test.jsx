import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccountMenu from './AccountMenu'

// Estados da interface do menu Conta, com o hook de sincronização simulado.
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

function renderMenu(overrides = {}) {
  return render(
    <AccountMenu sync={{ ...baseSync, ...overrides }} open onToggle={() => {}} onClose={() => {}} />
  )
}

describe('AccountMenu', () => {
  it('explica como ativar quando o Firebase não está configurado', () => {
    renderMenu({ configured: false })
    expect(screen.getByText(/CONFIGURAR-NUVEM\.md/)).toBeTruthy()
  })

  it('mostra o formulário de login quando deslogado', () => {
    renderMenu()
    expect(screen.getByLabelText('E-mail')).toBeTruthy()
    expect(screen.getByLabelText('Senha')).toBeTruthy()
    expect(screen.getByText('Entrar')).toBeTruthy()
  })

  it('pede para criar a frase-secreta quando a nuvem está vazia', () => {
    renderMenu({ user: { uid: 'u1', email: 'a@b.c' }, cloudDoc: null })
    expect(screen.getByText(/crie uma frase-secreta/i)).toBeTruthy()
    expect(screen.getByLabelText('Confirmar frase-secreta')).toBeTruthy()
  })

  it('pede a frase existente quando a nuvem já tem dados', () => {
    renderMenu({
      user: { uid: 'u1', email: 'a@b.c' },
      cloudDoc: { envelope: 'x', updatedAt: 10 },
    })
    expect(screen.getByText(/digite a frase-secreta criada no seu outro aparelho/i)).toBeTruthy()
    expect(screen.getByText('Esqueci a frase-secreta')).toBeTruthy()
  })

  it('oferece a escolha entre nuvem e aparelho em caso de conflito', () => {
    renderMenu({
      user: { uid: 'u1', email: 'a@b.c' },
      hasKey: true,
      conflict: { localUpdatedAt: 2000, cloudUpdatedAt: 1000, data: {} },
    })
    expect(screen.getByText(/usar dados da nuvem/i)).toBeTruthy()
    expect(screen.getByText(/usar dados deste aparelho/i)).toBeTruthy()
  })

  it('mostra o e-mail e o status quando sincronizado', () => {
    renderMenu({
      user: { uid: 'u1', email: 'a@b.c' },
      hasKey: true,
      cloudDoc: { envelope: 'x', updatedAt: 10 },
      syncStatus: 'synced',
    })
    expect(screen.getByText('a@b.c')).toBeTruthy()
    expect(screen.getByText('Sincronizado')).toBeTruthy()
    expect(screen.getByText('Sair da conta')).toBeTruthy()
  })
})

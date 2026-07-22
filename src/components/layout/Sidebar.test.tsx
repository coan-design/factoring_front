import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../../stores/auth-store';
import { Sidebar } from './Sidebar';

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Sidebar />} />
        <Route path="/login" element={<div>Tela de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token',
      usuario: { id: 'u1', nome: 'Renata Ávila', email: 'renata@cedrofactoring.com.br', perfil: 'OPERADOR' },
    });
  });

  it('opens the settings popover with Meu perfil, without Gerenciar usuários for a non-ADMIN', async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole('button', { name: 'Configurações' }));

    expect(await screen.findByText('Meu perfil')).toBeInTheDocument();
    expect(screen.queryByText('Gerenciar usuários')).not.toBeInTheDocument();
  });

  it('shows Gerenciar usuários in the popover for an ADMIN', async () => {
    useAuthStore.setState({
      accessToken: 'token',
      usuario: { id: 'u1', nome: 'Renata Ávila', email: 'renata@cedrofactoring.com.br', perfil: 'ADMIN' },
    });
    renderSidebar();
    await userEvent.click(screen.getByRole('button', { name: 'Configurações' }));

    expect(await screen.findByText('Gerenciar usuários')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar usuários').closest('a')).toHaveAttribute('href', '/usuarios');
  });

  it('logs out and redirects to /login', async () => {
    renderSidebar();
    await userEvent.click(screen.getByText('Sair do sistema'));

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});

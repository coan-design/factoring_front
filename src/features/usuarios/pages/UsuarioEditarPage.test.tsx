import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { UsuarioEditarPage } from './UsuarioEditarPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const USUARIO = {
  id: 'u1',
  nome: 'Diego Martins',
  email: 'diego.martins@cedrofactoring.com.br',
  perfil: 'OPERADOR',
  ativo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/usuarios/u1/editar']}>
        <Routes>
          <Route path="/usuarios/:id/editar" element={<UsuarioEditarPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UsuarioEditarPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedGet.mockResolvedValue({ data: USUARIO });
    mockedPatch.mockResolvedValue({ data: USUARIO });
  });

  it('prefills the form and saves nome/email/perfil via PATCH', async () => {
    renderPage();
    expect(await screen.findByDisplayValue('Diego Martins')).toBeInTheDocument();

    await userEvent.click(screen.getByText('ANALISTA'));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/usuarios/u1', {
        nome: 'Diego Martins',
        email: 'diego.martins@cedrofactoring.com.br',
        perfil: 'ANALISTA',
      });
    });
  });

  it('resets the password via the Redefinir senha panel', async () => {
    renderPage();
    await screen.findByDisplayValue('Diego Martins');

    await userEvent.click(screen.getByRole('button', { name: 'Definir nova senha' }));
    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha123');
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha123');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/usuarios/u1', { senha: 'novaSenha123' });
    });
    expect(await screen.findByText('Senha atualizada com sucesso.')).toBeInTheDocument();
  });

  it('inativa o usuário via o painel de status', async () => {
    renderPage();
    await screen.findByDisplayValue('Diego Martins');

    await userEvent.click(screen.getByRole('button', { name: 'Inativar' }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/usuarios/u1', { ativo: false });
    });
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/auth-store';
import { MeuPerfilPage } from './MeuPerfilPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const USUARIO = {
  id: 'u1',
  nome: 'Renata Ávila',
  email: 'renata.avila@cedrofactoring.com.br',
  perfil: 'ADMIN',
  ativo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MeuPerfilPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MeuPerfilPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedGet.mockResolvedValue({ data: USUARIO });
    useAuthStore.setState({ accessToken: 'token', usuario: { id: 'u1', nome: 'Renata Ávila', email: USUARIO.email, perfil: 'ADMIN' } });
  });

  it('renders profile data with e-mail disabled', async () => {
    renderPage();
    expect(await screen.findByDisplayValue('Renata Ávila')).toBeInTheDocument();
    const email = screen.getByDisplayValue('renata.avila@cedrofactoring.com.br') as HTMLInputElement;
    expect(email.disabled).toBe(true);
  });

  it('saves the nome via PATCH /auth/me and syncs the auth store', async () => {
    mockedPatch.mockResolvedValue({ data: { ...USUARIO, nome: 'Renata A. Silva' } });
    renderPage();
    const nomeInput = await screen.findByDisplayValue('Renata Ávila');
    await userEvent.clear(nomeInput);
    await userEvent.type(nomeInput, 'Renata A. Silva');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/auth/me', { nome: 'Renata A. Silva' });
    });
    await waitFor(() => {
      expect(useAuthStore.getState().usuario?.nome).toBe('Renata A. Silva');
    });
  });

  it('shows an inline error on the senha atual field when the API returns 401', async () => {
    mockedPatch.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { statusCode: 401, message: 'Senha atual incorreta', timestamp: '', path: '' } },
    });
    renderPage();
    await screen.findByDisplayValue('Renata Ávila');

    await userEvent.type(screen.getByLabelText('Senha atual'), 'senhaErrada');
    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha123');
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha123');
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar senha' }));

    expect(await screen.findByText('Senha atual incorreta')).toBeInTheDocument();
  });
});

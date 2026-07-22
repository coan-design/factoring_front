import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { UsuariosListPage } from './UsuariosListPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const USUARIOS = [
  {
    id: 'u1',
    nome: 'Renata Ávila',
    email: 'renata.avila@cedrofactoring.com.br',
    perfil: 'ADMIN',
    ativo: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u2',
    nome: 'Larissa Nunes',
    email: 'larissa.nunes@cedrofactoring.com.br',
    perfil: 'ANALISTA',
    ativo: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UsuariosListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UsuariosListPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedGet.mockResolvedValue({ data: { data: USUARIOS, total: 2, page: 1, pageSize: 100 } });
    mockedPatch.mockResolvedValue({ data: { ...USUARIOS[0], ativo: false } });
  });

  it('shows only active users on the Ativos tab by default', async () => {
    renderPage();
    expect(await screen.findByText('Renata Ávila')).toBeInTheDocument();
    expect(screen.queryByText('Larissa Nunes')).not.toBeInTheDocument();
  });

  it('switches to Inativos and shows the inactive user with Inativado em', async () => {
    renderPage();
    await screen.findByText('Renata Ávila');
    await userEvent.click(screen.getByRole('button', { name: 'Inativos' }));

    expect(await screen.findByText('Larissa Nunes')).toBeInTheDocument();
    expect(screen.queryByText('Renata Ávila')).not.toBeInTheDocument();
    expect(screen.getByText('09/06/2026')).toBeInTheDocument();
  });

  it('toggles a user status via PATCH /usuarios/:id', async () => {
    renderPage();
    await screen.findByText('Renata Ávila');
    await userEvent.click(screen.getByRole('button', { name: 'Inativar' }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/usuarios/u1', { ativo: false });
    });
  });

  it('filters by search across name and email', async () => {
    renderPage();
    await screen.findByText('Renata Ávila');
    await userEvent.type(screen.getByPlaceholderText('Buscar por nome ou e-mail'), 'zzz-nao-existe');

    expect(screen.queryByText('Renata Ávila')).not.toBeInTheDocument();
  });
});

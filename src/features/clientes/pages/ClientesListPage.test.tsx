import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { ClientesListPage } from './ClientesListPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const CLIENTES = [
  {
    id: 'cli-1',
    tipoCliente: 'PESSOA_JURIDICA',
    status: 'ATIVO',
    cpfCnpj: '12.345.678/0001-90',
    nome: 'Fecal Distribuidora',
    enderecoId: 'end-1',
  },
  {
    id: 'cli-2',
    tipoCliente: 'PESSOA_FISICA',
    status: 'INATIVO',
    cpfCnpj: '987.654.321-00',
    nome: 'Mariana Souza Ferreira',
    enderecoId: 'end-2',
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ClientesListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClientesListPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedGet.mockResolvedValue({
      data: { data: CLIENTES, total: 2, page: 1, pageSize: 8 },
    });
    mockedPatch.mockResolvedValue({ data: { ...CLIENTES[0], status: 'INATIVO' } });
  });

  it('lists clients with real status badges and document numbers', async () => {
    renderPage();
    expect(await screen.findByText('Fecal Distribuidora')).toBeInTheDocument();
    expect(screen.getByText('Mariana Souza Ferreira')).toBeInTheDocument();
    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Inativo').length).toBeGreaterThan(0);
    expect(screen.getByText('Mostrando 1–2 de 2 clientes')).toBeInTheDocument();
  });

  it('sends the busca filter to the API as the user types', async () => {
    renderPage();
    await screen.findByText('Fecal Distribuidora');
    await userEvent.type(screen.getByPlaceholderText('Buscar por nome, CNPJ ou CPF'), 'Fecal');

    await waitFor(() => {
      const lastCall = mockedGet.mock.calls.at(-1);
      expect(lastCall?.[1]?.params).toMatchObject({ busca: 'Fecal', page: 1 });
    });
  });

  it('toggles a client status via PATCH /clientes/:id/inativar', async () => {
    renderPage();
    await screen.findByText('Fecal Distribuidora');
    await userEvent.click(screen.getAllByText('Inativar')[0]);

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/clientes/cli-1/inativar');
    });
  });
});

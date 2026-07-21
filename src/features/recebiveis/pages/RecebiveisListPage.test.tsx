import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { RecebiveisListPage } from './RecebiveisListPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

const RECEBIVEIS = [
  {
    id: 'rec-1',
    clienteId: 'cli-1',
    tipo: 'CHEQUE',
    valorNominal: 9750,
    valorAberto: 9750,
    dataVencimento: '2026-07-10T00:00:00.000Z',
    status: 'VENCIDO',
    numeroCheque: '000452',
    banco: 'Banco Itaú',
    cliente: { id: 'cli-1', nome: 'Mercado Bela Vista' },
  },
  {
    id: 'rec-2',
    clienteId: 'cli-2',
    tipo: 'DUPLICATA',
    valorNominal: 18400,
    valorAberto: 18400,
    dataVencimento: '2026-07-22T00:00:00.000Z',
    status: 'PENDENTE',
    numeroDuplicata: 'DP-88213',
    sacado: 'Mercado Central SP',
    cliente: { id: 'cli-2', nome: 'Fecal Distribuidora Ltda.' },
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecebiveisListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RecebiveisListPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockResolvedValue({
      data: { data: RECEBIVEIS, total: 2, page: 1, pageSize: 8 },
    });
  });

  it('renders real recebíveis with status badges and formatted values', async () => {
    renderPage();
    expect(await screen.findByText('DP-88213')).toBeInTheDocument();
    expect(screen.getByText('000452')).toBeInTheDocument();
    expect(screen.getByText('R$ 18.400,00')).toBeInTheDocument();
    expect(screen.getAllByText('Vencido').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pendente').length).toBeGreaterThan(0);
  });

  it('does not send a busca param — the search input is disabled since /recebiveis has no such filter', async () => {
    renderPage();
    await screen.findByText('DP-88213');
    const input = screen.getByPlaceholderText('Buscar por cliente, número ou nota fiscal');
    expect(input).toBeDisabled();
  });

  it('sends the tipo filter to the API', async () => {
    renderPage();
    await screen.findByText('DP-88213');
    await userEvent.selectOptions(screen.getByDisplayValue('Todos os tipos'), 'DUPLICATA');

    await waitFor(() => {
      const lastCall = mockedGet.mock.calls.at(-1);
      expect(lastCall?.[1]?.params).toMatchObject({ tipo: 'DUPLICATA', page: 1 });
    });
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { NegociacoesListPage } from './NegociacoesListPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

const NEGOCIACOES = [
  {
    id: 'neg-1',
    numero: 'NG-2026-0341',
    titulo: 'Cessão de carteira julho — Fecal',
    dataNegociacao: '2026-07-18T00:00:00.000Z',
    status: 'APROVADA',
    tipoNegociacao: 'RECEBIVEIS',
    valorBruto: 216900,
    valorAReceber: 142760,
    clienteId: 'cli-1',
  },
  {
    id: 'neg-2',
    numero: 'NG-2026-0340',
    titulo: 'Cessão avulsa — Vitória',
    dataNegociacao: '2026-07-17T00:00:00.000Z',
    status: 'FINALIZADA',
    tipoNegociacao: 'RECEBIVEIS',
    valorBruto: 96740,
    valorAReceber: 0,
    clienteId: 'cli-2',
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NegociacoesListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NegociacoesListPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockImplementation(async (url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === '/negociacoes') {
        return { data: { data: NEGOCIACOES, total: 2, page: 1, pageSize: 8 } };
      }
      if (url === '/clientes/cli-1') return { data: { id: 'cli-1', nome: 'Fecal Distribuidora Ltda.' } };
      if (url === '/clientes/cli-2') return { data: { id: 'cli-2', nome: 'Metalúrgica Vitória S.A.' } };
      throw new Error(`unexpected GET ${url} ${JSON.stringify(config?.params)}`);
    });
  });

  it('lists negociações with resolved client names and status badges', async () => {
    renderPage();
    expect(await screen.findByText('Fecal Distribuidora Ltda.')).toBeInTheDocument();
    expect(screen.getByText('Metalúrgica Vitória S.A.')).toBeInTheDocument();
    expect(screen.getAllByText('Em andamento').length).toBeGreaterThan(0);
    expect(screen.getByText('NG-2026-0341')).toBeInTheDocument();
  });

  it('sends the status filter to the API', async () => {
    renderPage();
    await screen.findByText('Fecal Distribuidora Ltda.');
    await userEvent.selectOptions(screen.getByDisplayValue('Todos os status'), 'FINALIZADA');

    await waitFor(() => {
      const lastCall = mockedGet.mock.calls.filter((c) => c[0] === '/negociacoes').at(-1);
      expect(lastCall?.[1]?.params).toMatchObject({ status: 'FINALIZADA', page: 1 });
    });
  });
});

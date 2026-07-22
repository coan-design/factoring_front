import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { EmprestimosListPage } from './EmprestimosListPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

const HOJE = new Date();
const ONTEM = new Date(HOJE.getTime() - 24 * 60 * 60 * 1000).toISOString();
const AMANHA = new Date(HOJE.getTime() + 24 * 60 * 60 * 1000).toISOString();

const EMPRESTIMO_EM_ATRASO = {
  id: 'emp-1111-aaaa',
  clienteId: 'cli-1',
  dataContratacao: '2026-01-15T00:00:00.000Z',
  valorEmprestado: 180000,
  tipoJuros: 'SIMPLES',
  taxaJuros: 0.024,
  quantidadeParcelas: 12,
  parcelas: [
    { id: 'p1', numero: 1, dataVencimento: ONTEM, valor: 15000, valorPago: 0, status: 'PENDENTE' },
    { id: 'p2', numero: 2, dataVencimento: AMANHA, valor: 15000, valorPago: 0, status: 'PENDENTE' },
  ],
};

const EMPRESTIMO_QUITADO = {
  id: 'emp-2222-bbbb',
  clienteId: 'cli-2',
  dataContratacao: '2026-01-01T00:00:00.000Z',
  valorEmprestado: 60000,
  tipoJuros: 'SIMPLES',
  taxaJuros: 0.02,
  quantidadeParcelas: 1,
  parcelas: [{ id: 'p3', numero: 1, dataVencimento: ONTEM, valor: 60000, valorPago: 60000, status: 'PAGA' }],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EmprestimosListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmprestimosListPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockImplementation(async (url: string) => {
      if (url === '/emprestimos') {
        return { data: { data: [EMPRESTIMO_EM_ATRASO, EMPRESTIMO_QUITADO], total: 2, page: 1, pageSize: 8 } };
      }
      if (url === '/clientes/cli-1') return { data: { id: 'cli-1', nome: 'Metalúrgica Vitória S.A.' } };
      if (url === '/clientes/cli-2') return { data: { id: 'cli-2', nome: 'Distribuidora Alvorada' } };
      throw new Error(`unexpected GET ${url}`);
    });
  });

  it('derives Em atraso / Quitado status from parcelas and resolves client names', async () => {
    renderPage();
    expect(await screen.findByText('Metalúrgica Vitória S.A.')).toBeInTheDocument();
    expect(screen.getByText('Distribuidora Alvorada')).toBeInTheDocument();
    expect(screen.getByText('Em atraso')).toBeInTheDocument();
    expect(screen.getAllByText('Quitado').length).toBeGreaterThan(0);
    expect(screen.getByText('1 de 1')).toBeInTheDocument();
  });

  it('maps the status filter to comSaldoDevedor', async () => {
    renderPage();
    await screen.findByText('Metalúrgica Vitória S.A.');
    await userEvent.selectOptions(screen.getByDisplayValue('Todos os status'), 'ATIVO');

    await waitFor(() => {
      const lastCall = mockedGet.mock.calls.filter((c) => c[0] === '/emprestimos').at(-1);
      expect(lastCall?.[1]?.params).toMatchObject({ comSaldoDevedor: true, page: 1 });
    });
  });
});

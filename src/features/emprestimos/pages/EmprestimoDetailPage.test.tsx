import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { EmprestimoDetailPage } from './EmprestimoDetailPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const EMPRESTIMO = {
  id: 'emp-1234abcd',
  clienteId: 'cli-1',
  cliente: { id: 'cli-1', nome: 'Metalúrgica Vitória S.A.' },
  dataContratacao: '2026-01-15T00:00:00.000Z',
  valorEmprestado: 180000,
  quantidadeParcelas: 12,
  parcelas: [
    { id: 'p1', numero: 1, dataVencimento: '2026-01-25T00:00:00.000Z', valor: 17220, valorPago: 17220, status: 'PAGA' },
    { id: 'p2', numero: 2, dataVencimento: '2026-02-25T00:00:00.000Z', valor: 17220, valorPago: 17220, status: 'PAGA' },
    { id: 'p3', numero: 3, dataVencimento: '2026-07-25T00:00:00.000Z', valor: 17220, valorPago: 0, status: 'PENDENTE' },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/emprestimos/emp-1234abcd']}>
        <Routes>
          <Route path="/emprestimos/:id" element={<EmprestimoDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmprestimoDetailPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedGet.mockImplementation(async (url: string) => {
      if (url === '/emprestimos/emp-1234abcd') return { data: EMPRESTIMO };
      if (url === '/emprestimos/emp-1234abcd/valor-total') return { data: { valorTotal: 206640 } };
      if (url === '/emprestimos/emp-1234abcd/saldo-devedor') return { data: { saldoDevedor: 172200 } };
      throw new Error(`unexpected URL: ${url}`);
    });
    mockedPatch.mockResolvedValue({ data: {} });
  });

  it('renders client, disbursed value, real total and saldo devedor from the dedicated endpoints', async () => {
    renderPage();
    expect(await screen.findByText('Metalúrgica Vitória S.A.')).toBeInTheDocument();
    expect(screen.getByText('R$ 180.000,00')).toBeInTheDocument();
    expect(await screen.findByText('R$ 206.640,00')).toBeInTheDocument();
    expect(await screen.findByText('R$ 172.200,00')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('shows parcelas pagas count and next due date', async () => {
    renderPage();
    await screen.findByText('Metalúrgica Vitória S.A.');
    expect(screen.getByText('2 de 12')).toBeInTheDocument();
    const dataEsperada = new Date('2026-07-25T00:00:00.000Z').toLocaleDateString('pt-BR');
    expect(screen.getAllByText(dataEsperada).length).toBeGreaterThan(0);
  });

  it('only shows "Marcar pagamento" for unpaid installments, and calls the PATCH action', async () => {
    renderPage();
    await screen.findByText('Metalúrgica Vitória S.A.');
    const buttons = screen.getAllByText('Marcar pagamento');
    expect(buttons).toHaveLength(1);

    await userEvent.click(buttons[0]);
    expect(mockedPatch).toHaveBeenCalledWith('/parcelas-emprestimo/p3/pagar');
  });
});

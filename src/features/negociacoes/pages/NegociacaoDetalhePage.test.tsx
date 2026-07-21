import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/auth-store';
import { NegociacaoDetalhePage } from './NegociacaoDetalhePage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const NEGOCIACAO_APROVADA_SALDO_ZERO = {
  id: 'neg-1',
  numero: 'NG-2026-0341',
  titulo: 'Cessão de carteira julho',
  dataNegociacao: '2026-07-18T00:00:00.000Z',
  tipoNegociacao: 'RECEBIVEIS',
  status: 'APROVADA',
  formaPagamento: 'PIX',
  valorBruto: 17940,
  valorTarifas: 200,
  valorTotalReceber: 18400,
  valorPago: 18200,
  valorAReceber: 0,
  clienteId: 'cli-1',
  cliente: { id: 'cli-1', nome: 'Fecal Distribuidora Ltda.' },
  itensRecebivel: [
    {
      id: 'item-1',
      valorConsiderado: 18400,
      valorDesagio: 460,
      valorLiquido: 17940,
      recebivel: {
        id: 'rec-1',
        clienteId: 'cli-1',
        tipo: 'DUPLICATA',
        valorNominal: 18400,
        valorAberto: 200,
        dataVencimento: '2026-07-22T00:00:00.000Z',
        status: 'NEGOCIADO',
        numeroDuplicata: 'DP-88213',
      },
    },
  ],
  itensEmprestimo: [],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/negociacoes/neg-1']}>
        <Routes>
          <Route path="/negociacoes/:id" element={<NegociacaoDetalhePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NegociacaoDetalhePage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedGet.mockResolvedValue({ data: NEGOCIACAO_APROVADA_SALDO_ZERO });
    mockedPatch.mockResolvedValue({ data: { ...NEGOCIACAO_APROVADA_SALDO_ZERO, status: 'FINALIZADA' } });
    useAuthStore.setState({
      accessToken: 'tok',
      usuario: { id: 'u1', nome: 'Renata Ávila', email: 'r@x.com', perfil: 'OPERADOR' },
    });
  });

  it('renders real values from the API and the client name', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Cessão de carteira julho' })).toBeInTheDocument();
    expect(screen.getByText(/Fecal Distribuidora Ltda\./)).toBeInTheDocument();
    expect(screen.getAllByText('R$ 17.940,00').length).toBeGreaterThan(0);
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });

  it('enables "Finalizar negociação" when saldo is zero, status is APROVADA and perfil can write', async () => {
    renderPage();
    const botao = await screen.findByRole('button', { name: 'Finalizar negociação' });
    expect(botao).toBeEnabled();

    await userEvent.click(botao);
    expect(mockedPatch).toHaveBeenCalledWith('/negociacoes/neg-1/finalizar');
  });

  it('disables the button for perfil ANALISTA even with saldo zero', async () => {
    useAuthStore.setState({
      accessToken: 'tok',
      usuario: { id: 'u2', nome: 'Ana Lista', email: 'a@x.com', perfil: 'ANALISTA' },
    });
    renderPage();
    const botao = await screen.findByRole('button', { name: 'Finalizar negociação' });
    expect(botao).toBeDisabled();
  });

  it('disables the button when saldo a receber is not zero', async () => {
    mockedGet.mockResolvedValue({
      data: { ...NEGOCIACAO_APROVADA_SALDO_ZERO, valorAReceber: 500, valorPago: 17700 },
    });
    renderPage();
    const botao = await screen.findByRole('button', { name: 'Finalizar negociação' });
    expect(botao).toBeDisabled();
  });
});

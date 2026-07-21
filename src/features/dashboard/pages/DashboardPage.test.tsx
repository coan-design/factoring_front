import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { DashboardPage } from './DashboardPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

const INDICADORES = {
  recebiveisVencidos: { valor: 43180, quantidade: 18 },
  saldoTotalAReceber: { valor: 2918450 },
  emprestimosAtivos: { quantidade: 12, valor: 640000 },
  negociacoesEmAberto: { quantidade: 7, valor: 315200 },
};

const STATUS_MIX = [
  { status: 'PENDENTE', quantidade: 145, percentual: 58 },
  { status: 'VENCIDO', quantidade: 30, percentual: 12 },
  { status: 'QUITADO', quantidade: 60, percentual: 24 },
  { status: 'INADIMPLENTE', quantidade: 15, percentual: 6 },
];

const RECEITA_MENSAL = [
  { mes: '2026-02', desagio: 10000, tarifas: 2400 },
  { mes: '2026-03', desagio: 11000, tarifas: 2500 },
  { mes: '2026-04', desagio: 0, tarifas: 0 },
  { mes: '2026-05', desagio: 12000, tarifas: 2600 },
  { mes: '2026-06', desagio: 13000, tarifas: 2700 },
  { mes: '2026-07', desagio: 15400, tarifas: 2200 },
];

function paginado<T>(data: T[], total: number) {
  return { data: { data, total, page: 1, pageSize: data.length || 1 } };
}

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockImplementation(async (url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === '/dashboard/indicadores') return { data: INDICADORES };
      if (url === '/dashboard/recebiveis-por-status') return { data: STATUS_MIX };
      if (url === '/dashboard/receita-mensal') return { data: RECEITA_MENSAL };
      if (url === '/negociacoes' && config?.params?.pageSize === 5) {
        return paginado(
          [
            {
              id: 'ng-1',
              numero: 'NG-2026-0341',
              titulo: 'Cessão de carteira julho',
              dataNegociacao: '2026-07-18T00:00:00.000Z',
              status: 'APROVADA',
              tipoNegociacao: 'RECEBIVEIS',
              valorBruto: 184320.5,
              valorAReceber: 12400,
              clienteId: 'cli-1',
              cliente: { id: 'cli-1', nome: 'Fecal Distribuidora Ltda.' },
            },
          ],
          1,
        );
      }
      throw new Error(`unexpected URL in test: ${url}`);
    });
  });

  it('renders the 4 real KPIs from GET /dashboard/indicadores', async () => {
    renderDashboard();

    expect(await screen.findByText('R$ 315.200,00')).toBeInTheDocument();
    expect(screen.getByText('7 negociações em andamento')).toBeInTheDocument();

    expect(await screen.findByText('R$ 43.180,00')).toBeInTheDocument();
    expect(screen.getByText('18 títulos em atraso')).toBeInTheDocument();

    expect(await screen.findByText('R$ 640.000,00')).toBeInTheDocument();
    expect(screen.getByText('12 contratos vigentes')).toBeInTheDocument();

    expect(await screen.findByText('R$ 2.918.450,00')).toBeInTheDocument();
    expect(screen.getByText('Considerando todas as carteiras')).toBeInTheDocument();
  });

  it('renders recebíveis-por-status using the percentuais returned by the API, not recalculated', async () => {
    renderDashboard();
    expect(await screen.findByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('58%')).toBeInTheDocument();
    expect(screen.getByText('Vencido')).toBeInTheDocument();
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('24%')).toBeInTheDocument();
    expect(screen.getByText('Inadimplente')).toBeInTheDocument();
    expect(screen.getByText('6%')).toBeInTheDocument();
  });

  it('renders month labels from receita-mensal and a real growth figure (not a client-side sum from other endpoints)', async () => {
    renderDashboard();
    expect(await screen.findByText('Fev')).toBeInTheDocument();
    expect(screen.getByText('Jul')).toBeInTheDocument();
    // primeiro mês: 10000+2400=12400 · último mês: 15400+2200=17600 · crescimento = (17600-12400)/12400*100 = 41,9%
    expect(await screen.findByText('+41,9% em 6 meses')).toBeInTheDocument();
  });

  it('still renders Negociações recentes from GET /negociacoes (unchanged)', async () => {
    renderDashboard();
    expect(await screen.findByText('Fecal Distribuidora Ltda.')).toBeInTheDocument();
    expect(screen.getByText('NG-2026-0341')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('R$ 184.320,50')).toBeInTheDocument();
  });
});

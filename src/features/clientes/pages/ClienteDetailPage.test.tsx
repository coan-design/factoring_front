import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { ClienteDetailPage } from './ClienteDetailPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const CLIENTE = {
  id: 'cli-1',
  tipoCliente: 'PESSOA_JURIDICA',
  status: 'ATIVO',
  documento: '12.345.678/0001-90',
  razaoSocial: 'Fecal Distribuidora Ltda.',
  nomeFantasia: 'Fecal Distribuidora',
  inscricaoEstadual: '143.286.720.118',
  telefone: '(11) 4002-8922',
  email: 'financeiro@fecal.com.br',
  enderecoId: 'end-1',
  endereco: {
    id: 'end-1',
    logradouro: 'Av. Marquês de São Vicente, 2200',
    bairro: 'Barra Funda',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01139-000',
  },
};

const RECEBIVEIS = [
  {
    id: 'rec-1',
    clienteId: 'cli-1',
    tipo: 'DUPLICATA',
    valorNominal: 18400,
    valorAberto: 18400,
    dataVencimento: '2026-07-22T00:00:00.000Z',
    status: 'PENDENTE',
    numeroDuplicata: 'DP-88213',
    sacado: 'Mercado Central SP',
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clientes/cli-1']}>
        <Routes>
          <Route path="/clientes/:id" element={<ClienteDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClienteDetailPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedGet.mockImplementation(async (url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === '/clientes/cli-1') return { data: CLIENTE };
      if (url === '/recebiveis') return { data: { data: RECEBIVEIS, total: 1, page: 1, pageSize: 50 } };
      if (url === '/emprestimos') return { data: { data: [], total: 0, page: 1, pageSize: 50 } };
      if (url === '/negociacoes') {
        const status = config?.params?.status;
        return { data: { data: [], total: status === 'FINALIZADA' ? 3 : 1, page: 1, pageSize: 1 } };
      }
      throw new Error(`unexpected URL: ${url}`);
    });
    mockedPatch.mockResolvedValue({ data: { ...CLIENTE, status: 'INATIVO' } });
  });

  it('renders cadastral data, address, and the client header', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Fecal Distribuidora' })).toBeInTheDocument();
    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
    expect(screen.getByText('Barra Funda')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('shows real recebíveis in the first tab', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Fecal Distribuidora' });
    expect(await screen.findByText(/DP-88213/)).toBeInTheDocument();
    expect(screen.getByText(/Mercado Central SP/)).toBeInTheDocument();
  });

  it('shows real negotiation counts in the negociações tab', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Fecal Distribuidora' });
    await userEvent.click(screen.getByText('Negociações', { selector: 'div' }));
    expect(await screen.findByText('3 negociações concluídas, 1 em andamento.')).toBeInTheDocument();
  });

  it('toggles client status via PATCH /clientes/:id', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('Inativar cliente'));
    expect(mockedPatch).toHaveBeenCalledWith('/clientes/cli-1', { status: 'INATIVO' });
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { RecebiveisDetalhePage } from './RecebiveisDetalhePage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);

const RECEBIVEL = {
  id: 'rec-1',
  clienteId: 'cli-1',
  tipo: 'DUPLICATA',
  valorNominal: 18400,
  valorAberto: 18400,
  dataEmissao: '2026-06-01T00:00:00.000Z',
  dataVencimento: '2026-07-22T00:00:00.000Z',
  status: 'PENDENTE',
  numeroNotaFiscal: 'NF-e 45219',
  sacado: 'Mercado Central SP',
  aceite: true,
  createdAt: '2026-07-05T09:14:00.000Z',
  updatedAt: '2026-07-05T09:14:00.000Z',
};

const CLIENTE = {
  id: 'cli-1',
  tipoCliente: 'PESSOA_JURIDICA',
  status: 'ATIVO',
  cpfCnpj: '12.345.678/0001-90',
  nome: 'Fecal Distribuidora Ltda.',
  telefone: '(11) 4002-8922',
  email: 'financeiro@fecal.com.br',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/recebiveis/rec-1']}>
        <Routes>
          <Route path="/recebiveis/:id" element={<RecebiveisDetalhePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RecebiveisDetalhePage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedGet.mockImplementation(async (url: string) => {
      if (url === '/recebiveis/rec-1') return { data: RECEBIVEL };
      if (url === '/clientes/cli-1') return { data: CLIENTE };
      throw new Error(`unexpected GET ${url}`);
    });
  });

  it('renders KPIs, duplicata data and the client name', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Duplicata NF-e 45219' })).toBeInTheDocument();
    expect(screen.getByText('R$ 18.400,00')).toBeInTheDocument();
    expect(screen.getAllByText('Fecal Distribuidora Ltda.').length).toBeGreaterThan(0);
    expect(screen.getByText('Mercado Central SP')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument();
  });

  it('shows a derived history entry for the cadastro event', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Duplicata NF-e 45219' });
    expect(screen.getByText('Recebível cadastrado no sistema')).toBeInTheDocument();
  });

  it('uploads a document photo via multipart POST', async () => {
    mockedPost.mockResolvedValue({ data: { url: 'https://cdn.example.com/frente.png' } });
    renderPage();
    await screen.findByRole('heading', { name: 'Duplicata NF-e 45219' });

    const file = new File(['conteudo'], 'frente.png', { type: 'image/png' });
    const inputs = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(inputs[0] as HTMLInputElement, file);

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        '/recebiveis/rec-1/documentos',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
      );
    });
  });
});

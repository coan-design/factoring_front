import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { NegociacaoWizardPage } from './NegociacaoWizardPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPatch = vi.mocked(apiClient.patch);

const CLIENTE = {
  id: 'cli-1',
  tipoCliente: 'PESSOA_JURIDICA',
  status: 'ATIVO',
  documento: '12.345.678/0001-90',
  nomeFantasia: 'Fecal Distribuidora',
  enderecoId: 'end-1',
};

const RECEBIVEL = {
  id: 'rec-1',
  clienteId: 'cli-1',
  tipo: 'DUPLICATA',
  valorNominal: 18400,
  valorAberto: 18400,
  dataVencimento: '2026-08-22T00:00:00.000Z',
  status: 'PENDENTE',
  numeroDuplicata: 'DP-88213',
};

const NEGOCIACAO_CRIADA = {
  id: 'neg-1',
  numero: 'NG-2026-0342',
  titulo: 'Cessão julho',
  status: 'EM_ANALISE',
  tipoNegociacao: 'RECEBIVEIS',
  formaPagamento: 'PIX',
  valorBruto: 0,
  valorTarifas: 0,
  valorTotalReceber: 0,
  valorPago: 0,
  valorAReceber: 0,
  clienteId: 'cli-1',
  cliente: { id: 'cli-1', nome: 'Fecal Distribuidora Ltda.' },
  itensRecebivel: [],
  itensEmprestimo: [],
};

const NEGOCIACAO_COM_ITEM = {
  ...NEGOCIACAO_CRIADA,
  valorBruto: 17940,
  valorTotalReceber: 18400,
  valorAReceber: 18400,
  itensRecebivel: [
    { id: 'item-1', valorConsiderado: 18400, valorDesagio: 460, valorLiquido: 17940, recebivel: RECEBIVEL },
  ],
  itensEmprestimo: [],
};

function renderWizard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NegociacaoWizardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NegociacaoWizardPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();

    mockedGet.mockImplementation(async (url: string) => {
      if (url === '/clientes') return { data: { data: [CLIENTE], total: 1, page: 1, pageSize: 20 } };
      if (url === '/recebiveis') return { data: { data: [RECEBIVEL], total: 1, page: 1, pageSize: 100 } };
      if (url === '/emprestimos') return { data: { data: [], total: 0, page: 1, pageSize: 100 } };
      if (url === '/negociacoes/neg-1') return { data: NEGOCIACAO_COM_ITEM };
      throw new Error(`unexpected GET: ${url}`);
    });
    mockedPost.mockImplementation(async (url: string) => {
      if (url === '/negociacoes') return { data: NEGOCIACAO_CRIADA };
      if (url === '/negociacoes/neg-1/itens-recebivel') return { data: {} };
      throw new Error(`unexpected POST: ${url}`);
    });
    mockedPatch.mockResolvedValue({ data: { ...NEGOCIACAO_COM_ITEM, status: 'APROVADA' } });
  });

  it('walks through the wizard and creates the negociação + item exactly when advancing from step 2 to 3', async () => {
    renderWizard();

    // Passo 1
    await userEvent.type(screen.getByLabelText('Número da negociação'), 'NG-2026-0342');
    await userEvent.type(screen.getByLabelText('Título da negociação'), 'Cessão julho');
    await userEvent.type(screen.getByPlaceholderText('Buscar cliente'), 'Fecal');
    await screen.findByText('Fecal Distribuidora');
    await userEvent.click(screen.getByText('Fecal Distribuidora'));

    expect(mockedPost).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Passo 2: seleciona o recebível, exige taxa de deságio > 0 antes de avançar
    expect(await screen.findByText('DP-88213')).toBeInTheDocument();
    await userEvent.click(screen.getByText('DP-88213'));

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText(/Informe a taxa de deságio/)).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();

    const desagioInput = screen.getByText('Deságio').parentElement!.querySelector('input')!;
    await userEvent.clear(desagioInput);
    await userEvent.type(desagioInput, '2.5');

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/negociacoes', {
        numero: 'NG-2026-0342',
        titulo: 'Cessão julho',
        descricao: undefined,
        clienteId: 'cli-1',
        tipoNegociacao: 'RECEBIVEIS',
        formaPagamento: 'PIX',
      });
    });
    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        '/negociacoes/neg-1/itens-recebivel',
        expect.objectContaining({ recebivelId: 'rec-1', taxaDesagio: 2.5 }),
      );
    });

    // Passo 3: mostra os valores REAIS devolvidos pelo backend, não uma conta local
    expect((await screen.findAllByText('R$ 17.940,00')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('R$ 18.400,00').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Passo 4: aprovar chama PATCH /negociacoes/:id/aprovar
    await userEvent.click(await screen.findByRole('button', { name: 'Aprovar negociação' }));
    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/negociacoes/neg-1/aprovar');
    });
  });

  it('cancels an already-created negociação via PATCH .../cancelar when abandoning the wizard', async () => {
    renderWizard();
    await userEvent.type(screen.getByLabelText('Número da negociação'), 'NG-2026-0342');
    await userEvent.type(screen.getByLabelText('Título da negociação'), 'Cessão julho');
    await userEvent.type(screen.getByPlaceholderText('Buscar cliente'), 'Fecal');
    await screen.findByText('Fecal Distribuidora');
    await userEvent.click(screen.getByText('Fecal Distribuidora'));
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await screen.findByText('DP-88213');
    await userEvent.click(screen.getByText('DP-88213'));
    const desagioInput = screen.getByText('Deságio').parentElement!.querySelector('input')!;
    await userEvent.clear(desagioInput);
    await userEvent.type(desagioInput, '2.5');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await screen.findAllByText('R$ 17.940,00');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/negociacoes/neg-1/cancelar');
    });
  });
});

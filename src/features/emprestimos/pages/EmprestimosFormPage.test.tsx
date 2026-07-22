import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { EmprestimosFormPage } from './EmprestimosFormPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);

const CLIENTE = { id: 'cli-1', tipoCliente: 'PESSOA_JURIDICA', status: 'ATIVO', cpfCnpj: '12.345.678/0001-90', nome: 'Fecal Distribuidora' };

const EMPRESTIMO_CRIADO = {
  id: 'emp-new',
  clienteId: 'cli-1',
  dataContratacao: '2026-07-01T00:00:00.000Z',
  valorEmprestado: 100000,
  tipoJuros: 'SIMPLES',
  taxaJuros: 0.02,
  quantidadeParcelas: 12,
  parcelas: [],
  cliente: { id: 'cli-1', nome: 'Fecal Distribuidora' },
};

function renderNovo() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/emprestimos/novo']}>
        <Routes>
          <Route path="/emprestimos/novo" element={<EmprestimosFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderEditar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/emprestimos/emp-new/editar']}>
        <Routes>
          <Route path="/emprestimos/:id/editar" element={<EmprestimosFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmprestimosFormPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('creates the empréstimo with tipoJuros fixed to SIMPLES and the rate converted to a fraction, then unlocks the contrato upload', async () => {
    mockedGet.mockResolvedValue({ data: { data: [CLIENTE], total: 1, page: 1, pageSize: 100 } });
    mockedPost.mockResolvedValue({ data: EMPRESTIMO_CRIADO });

    renderNovo();

    await screen.findByText('Fecal Distribuidora');
    await userEvent.selectOptions(screen.getByLabelText('Cliente (tomador)'), 'cli-1');
    await userEvent.type(screen.getByLabelText('Valor emprestado'), '100000');
    await userEvent.type(screen.getByLabelText('Data de contratação'), '2026-07-01');
    await userEvent.type(screen.getByLabelText('Taxa de juros (% a.m.)'), '2');
    await userEvent.type(screen.getByLabelText('Número de parcelas'), '12');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar empréstimo' }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/emprestimos', {
        clienteId: 'cli-1',
        valorEmprestado: 100000,
        tipoJuros: 'SIMPLES',
        taxaJuros: 0.02,
        quantidadeParcelas: 12,
        dataContratacao: '2026-07-01',
      });
    });

    expect(await screen.findByText('Upload do contrato')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument();
  });

  it('shows locked contract-only editing on the editar route, without a PATCH to the loan terms', async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url === '/emprestimos/emp-new') return { data: EMPRESTIMO_CRIADO };
      throw new Error(`unexpected GET ${url}`);
    });

    renderEditar();

    expect(await screen.findByRole('heading', { name: 'Editar contrato de empréstimo' })).toBeInTheDocument();
    expect(screen.getByText('Fecal Distribuidora')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cliente (tomador)')).not.toBeInTheDocument();
    expect(screen.getByText('Upload do contrato')).toBeInTheDocument();
  });
});

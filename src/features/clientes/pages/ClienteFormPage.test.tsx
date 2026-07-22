import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { ClienteFormPage } from './ClienteFormPage';

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
  cpfCnpj: '12.345.678/0001-90',
  nome: 'Fecal Distribuidora',
  telefone: '(11) 4002-8922',
  email: 'financeiro@fecal.com.br',
  enderecoId: 'end-1',
  endereco: {
    id: 'end-1',
    cep: '01139-000',
    logradouro: 'Av. Marquês de São Vicente',
    numero: '2200',
    bairro: 'Barra Funda',
    cidade: 'São Paulo',
    estado: 'SP',
  },
};

function renderNovo() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clientes/novo']}>
        <Routes>
          <Route path="/clientes/novo" element={<ClienteFormPage />} />
          <Route path="/clientes/:id" element={<div>Detalhe do cliente</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderEditar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clientes/cli-1/editar']}>
        <Routes>
          <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClienteFormPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
  });

  it('creates the endereço then the cliente, in that order, on the novo flow', async () => {
    mockedPost.mockImplementation(async (url: string) => {
      if (url === '/enderecos') return { data: { ...CLIENTE.endereco, id: 'end-new' } };
      if (url === '/clientes') return { data: { ...CLIENTE, id: 'cli-new' } };
      throw new Error(`unexpected POST ${url}`);
    });

    renderNovo();

    await userEvent.type(screen.getByLabelText('Razão social'), 'Fecal Distribuidora Ltda.');
    await userEvent.type(screen.getByLabelText('CNPJ'), '12.345.678/0001-90');
    await userEvent.type(screen.getByLabelText('Telefone'), '(11) 4002-8922');
    await userEvent.type(screen.getByLabelText('E-mail'), 'financeiro@fecal.com.br');
    await userEvent.type(screen.getByLabelText('Logradouro'), 'Av. Marquês de São Vicente');
    await userEvent.type(screen.getByLabelText('Número'), '2200');
    await userEvent.type(screen.getByLabelText('CEP'), '01139-000');
    await userEvent.type(screen.getByLabelText('Bairro'), 'Barra Funda');
    await userEvent.type(screen.getByLabelText('Cidade'), 'São Paulo');
    await userEvent.selectOptions(screen.getByLabelText('UF'), 'SP');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenNthCalledWith(1, '/enderecos', {
        cep: '01139-000',
        logradouro: 'Av. Marquês de São Vicente',
        numero: '2200',
        bairro: 'Barra Funda',
        cidade: 'São Paulo',
        estado: 'SP',
      });
    });
    expect(mockedPost).toHaveBeenNthCalledWith(2, '/clientes', {
      nome: 'Fecal Distribuidora Ltda.',
      cpfCnpj: '12.345.678/0001-90',
      tipoCliente: 'PESSOA_JURIDICA',
      email: 'financeiro@fecal.com.br',
      telefone: '(11) 4002-8922',
      enderecoId: 'end-new',
    });
  });

  it('prefills the form and updates the existing endereço + cliente on the editar flow', async () => {
    mockedGet.mockResolvedValue({ data: CLIENTE });
    mockedPatch.mockImplementation(async (url: string) => {
      if (url === '/enderecos/end-1') return { data: CLIENTE.endereco };
      if (url === '/clientes/cli-1') return { data: CLIENTE };
      throw new Error(`unexpected PATCH ${url}`);
    });

    renderEditar();

    expect(await screen.findByDisplayValue('Fecal Distribuidora')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/enderecos/end-1', expect.objectContaining({ cidade: 'São Paulo' }));
    });
    expect(mockedPatch).toHaveBeenCalledWith('/clientes/cli-1', expect.objectContaining({ nome: 'Fecal Distribuidora' }));
  });

  it('shows validation errors when required fields are missing', async () => {
    renderNovo();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }));

    expect(await screen.findByText('Informe o nome')).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { RecebivelForm } from './RecebivelForm';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecebivelForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RecebivelForm', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedGet.mockResolvedValue({
      data: {
        data: [{ id: 'cli-1', tipoCliente: 'PESSOA_JURIDICA', status: 'ATIVO', documento: '12.345.678/0001-90', nomeFantasia: 'Fecal Distribuidora', enderecoId: 'end-1' }],
        total: 1,
        page: 1,
        pageSize: 100,
      },
    });
    mockedPost.mockResolvedValue({ data: { id: 'rec-new' } });
  });

  it('defaults to Cheque and shows cheque-specific fields', async () => {
    renderForm();
    expect(await screen.findByLabelText('Banco')).toBeInTheDocument();
    expect(screen.getByLabelText('Número do cheque')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sacado')).not.toBeInTheDocument();
  });

  it('switches to Duplicata fields when toggled', async () => {
    renderForm();
    await screen.findByLabelText('Banco');
    await userEvent.click(screen.getByRole('button', { name: 'Duplicata' }));
    expect(await screen.findByLabelText('Sacado')).toBeInTheDocument();
    expect(screen.getByLabelText('Número da duplicata')).toBeInTheDocument();
    expect(screen.queryByLabelText('Banco')).not.toBeInTheDocument();
  });

  it('submits the cheque payload with the correct shape', async () => {
    renderForm();
    await screen.findByLabelText('Banco');
    await screen.findByText('Fecal Distribuidora');

    await userEvent.selectOptions(screen.getByLabelText('Cliente (cedente)'), 'cli-1');
    await userEvent.type(screen.getByLabelText('Valor de face'), '9750');
    await userEvent.type(screen.getByLabelText('Data de vencimento'), '2026-07-10');
    await userEvent.type(screen.getByLabelText('Banco'), 'Itaú Unibanco');
    await userEvent.type(screen.getByLabelText('Agência'), '1234');
    await userEvent.type(screen.getByLabelText('Número do cheque'), '000452');
    await userEvent.type(screen.getByLabelText('Emitente'), 'João da Silva');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar recebível' }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/recebiveis', {
        tipo: 'CHEQUE',
        clienteId: 'cli-1',
        valorNominal: 9750,
        dataVencimento: '2026-07-10',
        banco: 'Itaú Unibanco',
        agencia: '1234',
        numeroCheque: '000452',
        emitente: 'João da Silva',
      });
    });
  });

  it('shows validation errors when required fields are missing', async () => {
    renderForm();
    await screen.findByLabelText('Banco');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar recebível' }));

    expect(await screen.findByText('Selecione o cliente')).toBeInTheDocument();
    expect(screen.getByText('Informe o valor')).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });
});

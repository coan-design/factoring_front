import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import { UsuarioFormPage } from './UsuarioFormPage';

vi.mock('../../../lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}));

const mockedPost = vi.mocked(apiClient.post);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UsuarioFormPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UsuarioFormPage', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedPost.mockResolvedValue({ data: { id: 'u-new' } });
  });

  it('defaults to OPERADOR and creates the usuario with the picked perfil', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText('Nome completo'), 'Diego Martins');
    await userEvent.type(screen.getByLabelText('E-mail corporativo'), 'diego.martins@cedrofactoring.com.br');
    await userEvent.type(screen.getByLabelText('Senha temporária'), 'senha123');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha123');
    await userEvent.click(screen.getByText('ADMIN'));

    await userEvent.click(screen.getByRole('button', { name: 'Salvar usuário' }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/usuarios', {
        nome: 'Diego Martins',
        email: 'diego.martins@cedrofactoring.com.br',
        senha: 'senha123',
        perfil: 'ADMIN',
      });
    });
  });

  it('validates password confirmation and minimum length', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Diego Martins');
    await userEvent.type(screen.getByLabelText('E-mail corporativo'), 'diego.martins@cedrofactoring.com.br');
    await userEvent.type(screen.getByLabelText('Senha temporária'), 'abc');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'xyz');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar usuário' }));

    expect(await screen.findByText('A senha deve ter ao menos 6 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });
});

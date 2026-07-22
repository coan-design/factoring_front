import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Cliente, TipoCliente } from '../../../types/cliente';
import type { Endereco, EnderecoPayload } from '../../../types/endereco';

export interface ClientePayload {
  nome: string;
  cpfCnpj: string;
  tipoCliente: TipoCliente;
  email: string;
  telefone: string;
  enderecoId?: string;
}

export function useCriarEndereco() {
  return useMutation({
    mutationFn: async (payload: EnderecoPayload) => {
      const { data } = await apiClient.post<Endereco>('/enderecos', payload);
      return data;
    },
  });
}

export function useAtualizarEndereco() {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: EnderecoPayload }) => {
      const { data } = await apiClient.patch<Endereco>(`/enderecos/${id}`, payload);
      return data;
    },
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClientePayload) => {
      const { data } = await apiClient.post<Cliente>('/clientes', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useAtualizarCliente(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClientePayload) => {
      const { data } = await apiClient.patch<Cliente>(`/clientes/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes', id] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Paginated } from '../../../types/common';
import type { Cliente, StatusCliente, TipoCliente } from '../../../types/cliente';

export interface ClientesFiltro {
  page: number;
  status?: StatusCliente;
  tipoCliente?: TipoCliente;
  busca?: string;
}

const PAGE_SIZE = 8;

export function useClientes(filtro: ClientesFiltro) {
  return useQuery({
    queryKey: ['clientes', filtro],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Cliente>>('/clientes', {
        params: {
          page: filtro.page,
          pageSize: PAGE_SIZE,
          ...(filtro.status ? { status: filtro.status } : {}),
          ...(filtro.tipoCliente ? { tipoCliente: filtro.tipoCliente } : {}),
          ...(filtro.busca ? { busca: filtro.busca } : {}),
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

/** Lista compacta de clientes ativos para combobox (seletor de cedente em formulários). */
export function useClientesAtivos() {
  return useQuery({
    queryKey: ['clientes', 'ativos-combo'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Cliente>>('/clientes', {
        params: { status: 'ATIVO', page: 1, pageSize: 100 },
      });
      return data.data;
    },
  });
}

export function useAlternarStatusCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusCliente }) => {
      const { data } = await apiClient.patch<Cliente>(`/clientes/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

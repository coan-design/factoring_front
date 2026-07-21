import { useQueries, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Cliente } from '../../../types/cliente';
import type { Paginated } from '../../../types/common';
import type { Emprestimo } from '../../../types/emprestimo';
import type { Recebivel } from '../../../types/recebivel';

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Cliente>(`/clientes/${id}`);
      return data;
    },
  });
}

export function useRecebiveisDoCliente(clienteId: string) {
  return useQuery({
    queryKey: ['recebiveis', 'cliente', clienteId],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Recebivel>>('/recebiveis', {
        params: { clienteId, page: 1, pageSize: 50 },
      });
      return data;
    },
  });
}

/**
 * "N empréstimos ativos — R$ Y em saldo devedor" (aba Empréstimos do
 * mockup). Não há endpoint de agregação, mas para UM cliente o número de
 * empréstimos com saldo devedor é pequeno o bastante para somar via o
 * endpoint por-empréstimo `GET /emprestimos/:id/saldo-devedor` (N+1
 * aceitável neste escopo, diferente de uma agregação do sistema inteiro).
 */
export function useEmprestimosAtivosResumo(clienteId: string) {
  const ativos = useQuery({
    queryKey: ['emprestimos', 'cliente', clienteId, 'ativos'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Emprestimo>>('/emprestimos', {
        params: { clienteId, comSaldoDevedor: true, page: 1, pageSize: 50 },
      });
      return data;
    },
  });

  const saldos = useQueries({
    queries: (ativos.data?.data ?? []).map((emprestimo) => ({
      queryKey: ['emprestimos', emprestimo.id, 'saldo-devedor'],
      queryFn: async () => {
        const { data } = await apiClient.get<{ saldoDevedor: number }>(
          `/emprestimos/${emprestimo.id}/saldo-devedor`,
        );
        return data.saldoDevedor;
      },
      enabled: !!ativos.data,
    })),
  });

  return {
    isLoading: ativos.isLoading || saldos.some((s) => s.isLoading),
    quantidade: ativos.data?.total ?? 0,
    saldoDevedorTotal: saldos.reduce((acc, s) => acc + (s.data ?? 0), 0),
  };
}

/** "N negociações concluídas, M em andamento" — contagens reais via `total` da paginação. */
export function useNegociacoesResumo(clienteId: string) {
  const results = useQueries({
    queries: [
      {
        queryKey: ['negociacoes', 'cliente', clienteId, 'FINALIZADA'],
        queryFn: async () => {
          const { data } = await apiClient.get<Paginated<unknown>>('/negociacoes', {
            params: { clienteId, status: 'FINALIZADA', page: 1, pageSize: 1 },
          });
          return data.total;
        },
      },
      {
        queryKey: ['negociacoes', 'cliente', clienteId, 'APROVADA'],
        queryFn: async () => {
          const { data } = await apiClient.get<Paginated<unknown>>('/negociacoes', {
            params: { clienteId, status: 'APROVADA', page: 1, pageSize: 1 },
          });
          return data.total;
        },
      },
    ],
  });

  return {
    isLoading: results.some((r) => r.isLoading),
    finalizadas: results[0].data ?? 0,
    emAndamento: results[1].data ?? 0,
  };
}

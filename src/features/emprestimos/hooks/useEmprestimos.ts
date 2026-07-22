import { useQueries, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Paginated } from '../../../types/common';
import type { Cliente } from '../../../types/cliente';
import type { Emprestimo } from '../../../types/emprestimo';

export interface EmprestimosFiltro {
  page: number;
  /** true = ativos (com saldo devedor), false = quitados, undefined = todos. Não há partição própria para "em atraso" na API — ver statusDerivadoEmprestimo. */
  comSaldoDevedor?: boolean;
}

const PAGE_SIZE = 8;

export function useEmprestimos(filtro: EmprestimosFiltro) {
  return useQuery({
    queryKey: ['emprestimos', filtro],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Emprestimo>>('/emprestimos', {
        params: {
          page: filtro.page,
          pageSize: PAGE_SIZE,
          ...(filtro.comSaldoDevedor !== undefined ? { comSaldoDevedor: filtro.comSaldoDevedor } : {}),
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

/**
 * GET /emprestimos não inclui a relação `cliente` — resolve nome por
 * clienteId via N+1 (mesmo padrão já usado em useEmprestimosAtivosResumo,
 * aceitável para uma página de 8 itens).
 */
export function useNomesClientes(clienteIds: string[]) {
  const idsUnicos = Array.from(new Set(clienteIds));
  const results = useQueries({
    queries: idsUnicos.map((id) => ({
      queryKey: ['clientes', id, 'nome'],
      queryFn: async () => {
        const { data } = await apiClient.get<Cliente>(`/clientes/${id}`);
        return data;
      },
    })),
  });

  const nomesPorId: Record<string, string> = {};
  idsUnicos.forEach((id, i) => {
    if (results[i].data) nomesPorId[id] = results[i].data!.nome;
  });

  return { nomesPorId, isLoading: results.some((r) => r.isLoading) };
}

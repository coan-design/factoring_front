import { useQueries, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Cliente } from '../../../types/cliente';
import type { Paginated } from '../../../types/common';
import type { NegociacaoResumo, StatusNegociacao } from '../../../types/negociacao';

export interface NegociacoesFiltro {
  page: number;
  status?: StatusNegociacao;
}

const PAGE_SIZE = 8;

export function useNegociacoesListagem(filtro: NegociacoesFiltro) {
  return useQuery({
    queryKey: ['negociacoes', 'listagem', filtro],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<NegociacaoResumo>>('/negociacoes', {
        params: {
          page: filtro.page,
          pageSize: PAGE_SIZE,
          ...(filtro.status ? { status: filtro.status } : {}),
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

/** GET /negociacoes não inclui a relação `cliente` (INCLUDE_ITENS não a lista) — resolve por N+1, mesmo padrão de useNomesClientes em emprestimos. */
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

  return nomesPorId;
}

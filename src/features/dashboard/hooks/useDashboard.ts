import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Paginated } from '../../../types/common';
import type { NegociacaoResumo } from '../../../types/negociacao';

export function useNegociacoesRecentes() {
  return useQuery({
    queryKey: ['negociacoes', 'recentes'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<NegociacaoResumo>>('/negociacoes', {
        params: { page: 1, pageSize: 5 },
      });
      return data;
    },
  });
}

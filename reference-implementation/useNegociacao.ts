import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Negociacao } from '../../../types/negociacao';

export function useNegociacao(id: string) {
  return useQuery({
    queryKey: ['negociacoes', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Negociacao>(`/negociacoes/${id}`);
      return data;
    },
  });
}

export function useFinalizarNegociacao(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch<Negociacao>(`/negociacoes/${id}/finalizar`);
      return data;
    },
    onSuccess: (negociacao) => {
      queryClient.setQueryData(['negociacoes', id], negociacao);
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
    },
    // 409 quando valorAReceber != 0 — deixe o componente tratar a mensagem,
    // não escondemos o erro aqui.
  });
}

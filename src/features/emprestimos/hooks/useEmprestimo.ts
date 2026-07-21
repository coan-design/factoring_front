import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Emprestimo } from '../../../types/emprestimo';

export function useEmprestimo(id: string) {
  return useQuery({
    queryKey: ['emprestimos', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Emprestimo>(`/emprestimos/${id}`);
      return data;
    },
  });
}

export function useValorTotalEmprestimo(id: string) {
  return useQuery({
    queryKey: ['emprestimos', id, 'valor-total'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ valorTotal: number }>(`/emprestimos/${id}/valor-total`);
      return data.valorTotal;
    },
  });
}

export function useSaldoDevedorEmprestimo(id: string) {
  return useQuery({
    queryKey: ['emprestimos', id, 'saldo-devedor'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ saldoDevedor: number }>(`/emprestimos/${id}/saldo-devedor`);
      return data.saldoDevedor;
    },
  });
}

/**
 * Não documentado explicitamente no contrato auditado — inferido por
 * analogia às ações customizadas já existentes (`/negociacoes/:id/aprovar`,
 * `/negociacoes/:id/finalizar`). `parcelas-emprestimo` é um recurso real
 * citado nas rotas raiz; confirme o path exato contra o Swagger.
 */
export function useMarcarPagamentoParcela(emprestimoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (parcelaId: string) => {
      const { data } = await apiClient.patch(`/parcelas-emprestimo/${parcelaId}/pagar`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos', emprestimoId] });
      queryClient.invalidateQueries({ queryKey: ['emprestimos', emprestimoId, 'saldo-devedor'] });
    },
  });
}

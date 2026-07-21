import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { ReceitaMensalItem } from '../../../types/dashboard';

/** Últimos 6 meses (default do backend) — a tela não tem controle de período. */
export function useReceitaMensal() {
  return useQuery({
    queryKey: ['dashboard', 'receita-mensal'],
    queryFn: async () => {
      const { data } = await apiClient.get<ReceitaMensalItem[]>('/dashboard/receita-mensal');
      return data;
    },
  });
}

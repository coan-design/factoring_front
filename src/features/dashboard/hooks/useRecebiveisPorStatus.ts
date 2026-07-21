import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { RecebivelPorStatusItem } from '../../../types/dashboard';

export function useRecebiveisPorStatus() {
  return useQuery({
    queryKey: ['dashboard', 'recebiveis-por-status'],
    queryFn: async () => {
      const { data } = await apiClient.get<RecebivelPorStatusItem[]>('/dashboard/recebiveis-por-status');
      return data;
    },
  });
}

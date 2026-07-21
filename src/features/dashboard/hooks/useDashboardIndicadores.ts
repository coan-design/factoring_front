import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { DashboardIndicadores } from '../../../types/dashboard';

/** Os 4 KPIs do topo do Dashboard — agregação real, não derivada de listagens paginadas. */
export function useDashboardIndicadores() {
  return useQuery({
    queryKey: ['dashboard', 'indicadores'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardIndicadores>('/dashboard/indicadores');
      return data;
    },
  });
}

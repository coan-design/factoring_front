import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Paginated } from '../../../types/common';
import type { Recebivel, StatusRecebivel, TipoRecebivel } from '../../../types/recebivel';

export interface RecebiveisFiltro {
  page: number;
  status?: StatusRecebivel;
  tipo?: TipoRecebivel;
  clienteId?: string;
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
}

const PAGE_SIZE = 8;

export function useRecebiveis(filtro: RecebiveisFiltro) {
  return useQuery({
    queryKey: ['recebiveis', filtro],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Recebivel>>('/recebiveis', {
        params: {
          page: filtro.page,
          pageSize: PAGE_SIZE,
          ...(filtro.status ? { status: filtro.status } : {}),
          ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
          ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
          ...(filtro.dataVencimentoInicio ? { dataVencimentoInicio: filtro.dataVencimentoInicio } : {}),
          ...(filtro.dataVencimentoFim ? { dataVencimentoFim: filtro.dataVencimentoFim } : {}),
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

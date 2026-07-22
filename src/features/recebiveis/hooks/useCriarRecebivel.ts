import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Recebivel, TipoRecebivel } from '../../../types/recebivel';

export interface CriarRecebivelPayload {
  tipo: TipoRecebivel;
  clienteId: string;
  valorNominal: number;
  dataEmissao: string;
  dataVencimento: string;
  // Duplicata
  numeroNotaFiscal?: string;
  aceite?: boolean;
  sacado?: string;
  // Cheque
  banco?: string;
  agencia?: string;
  conta?: string;
  numeroCheque?: string;
  dataBomPara?: string;
  emitente?: string;
}

export function useCriarRecebivel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CriarRecebivelPayload) => {
      const { data } = await apiClient.post<Recebivel>('/recebiveis', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Emprestimo, TipoJuros } from '../../../types/emprestimo';

export interface CriarEmprestimoPayload {
  clienteId: string;
  valorEmprestado: number;
  tipoJuros: TipoJuros;
  taxaJuros: number;
  quantidadeParcelas: number;
  dataContratacao: string;
}

export function useCriarEmprestimo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CriarEmprestimoPayload) => {
      const { data } = await apiClient.post<Emprestimo>('/emprestimos', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
    },
  });
}

/** multipart/form-data — POST /emprestimos/:id/contrato, campo `arquivo` (imagem ou PDF, até 10MB). */
export function useUploadContratoEmprestimo(emprestimoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (arquivo: File) => {
      const form = new FormData();
      form.append('arquivo', arquivo);
      const { data } = await apiClient.post<{ url: string }>(`/emprestimos/${emprestimoId}/contrato`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos', emprestimoId] });
    },
  });
}

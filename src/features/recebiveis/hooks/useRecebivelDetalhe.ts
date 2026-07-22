import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Recebivel } from '../../../types/recebivel';

export function useRecebivel(id: string) {
  return useQuery({
    queryKey: ['recebiveis', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Recebivel>(`/recebiveis/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export type LadoDocumento = 'FRENTE' | 'VERSO';

/** multipart/form-data — POST /recebiveis/:id/documentos, campos `lado` + `arquivo` (imagem, até 10MB). */
export function useUploadDocumentoRecebivel(recebivelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lado, arquivo }: { lado: LadoDocumento; arquivo: File }) => {
      const form = new FormData();
      form.append('lado', lado);
      form.append('arquivo', arquivo);
      const { data } = await apiClient.post<{ url: string }>(`/recebiveis/${recebivelId}/documentos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recebiveis', recebivelId] });
    },
  });
}

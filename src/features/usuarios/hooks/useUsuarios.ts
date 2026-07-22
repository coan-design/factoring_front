import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Paginated } from '../../../types/common';
import type { PerfilUsuario, Usuario } from '../../../types/usuario';

/**
 * GET /usuarios só aceita page/pageSize (sem `ativo`, `busca` nem `perfil`
 * — conferido em usuarios.controller.ts). Como a lista de usuários internos
 * tende a ser pequena, buscamos até o teto de pageSize da API (100) e
 * filtramos/paginamos no cliente, em vez de fingir que o backend particiona
 * isso.
 */
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Usuario>>('/usuarios', {
        params: { page: 1, pageSize: 100 },
      });
      return data.data;
    },
  });
}

export function useUsuario(id: string) {
  return useQuery({
    queryKey: ['usuarios', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Usuario>(`/usuarios/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface CriarUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
}

export function useCriarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CriarUsuarioPayload) => {
      const { data } = await apiClient.post<Usuario>('/usuarios', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useAtualizarUsuario(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { nome: string; email: string; perfil: PerfilUsuario }) => {
      const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}`, payload);
      return data;
    },
    onSuccess: (usuario) => {
      queryClient.setQueryData(['usuarios', id], usuario);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useRedefinirSenhaUsuario(id: string) {
  return useMutation({
    mutationFn: async (senha: string) => {
      const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}`, { senha });
      return data;
    },
  });
}

export function useAlternarAtivoUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}`, { ativo });
      return data;
    },
    onSuccess: (usuario) => {
      queryClient.setQueryData(['usuarios', usuario.id], usuario);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

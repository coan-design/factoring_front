import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/auth-store';
import type { Usuario } from '../../../types/usuario';

export function useMeuPerfil() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<Usuario>('/auth/me');
      return data;
    },
  });
}

/** PATCH /auth/me { nome } — só o nome é editável (e-mail e perfil não). Sincroniza o auth-store para a Sidebar refletir o novo nome sem precisar de novo login. */
export function useAtualizarMeuPerfil() {
  const queryClient = useQueryClient();
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario);
  return useMutation({
    mutationFn: async (nome: string) => {
      const { data } = await apiClient.patch<Usuario>('/auth/me', { nome });
      return data;
    },
    onSuccess: (usuario) => {
      queryClient.setQueryData(['auth', 'me'], usuario);
      atualizarUsuario({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
    },
  });
}

/** PATCH /auth/me/senha { senhaAtual, novaSenha } — o backend responde 401 "Senha atual incorreta" quando a senha atual não confere. */
export function useAlterarMinhaSenha() {
  return useMutation({
    mutationFn: async ({ senhaAtual, novaSenha }: { senhaAtual: string; novaSenha: string }) => {
      const { data } = await apiClient.patch<Usuario>('/auth/me/senha', { senhaAtual, novaSenha });
      return data;
    },
  });
}

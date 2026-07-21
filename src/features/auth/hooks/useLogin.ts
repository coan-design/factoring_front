import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore, type PerfilUsuario } from '../../../stores/auth-store';

interface LoginResponse {
  accessToken: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: PerfilUsuario;
  };
}

interface LoginPayload {
  email: string;
  senha: string;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      setSession(data.accessToken, data.usuario);
    },
  });
}

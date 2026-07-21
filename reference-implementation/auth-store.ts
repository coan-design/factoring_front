import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PerfilUsuario = 'ADMIN' | 'OPERADOR' | 'ANALISTA';

interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

interface AuthState {
  accessToken: string | null;
  usuario: UsuarioLogado | null;
  setSession: (accessToken: string, usuario: UsuarioLogado) => void;
  logout: () => void;
}

/**
 * Persistido, conforme o prompt de frontend. Atenção ao nome do campo:
 * o backend devolve `accessToken` no login (não `token`).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      usuario: null,
      setSession: (accessToken, usuario) => set({ accessToken, usuario }),
      logout: () => set({ accessToken: null, usuario: null }),
    }),
    { name: 'factoring-auth' },
  ),
);

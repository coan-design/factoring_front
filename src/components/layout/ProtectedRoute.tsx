import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, type PerfilUsuario } from '../../stores/auth-store';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Restringe a rota a perfis específicos (RBAC). Omitido = qualquer usuário autenticado. */
  allowedPerfis?: PerfilUsuario[];
}

export function ProtectedRoute({ children, allowedPerfis }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const perfil = useAuthStore((s) => s.usuario?.perfil);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  if (allowedPerfis && (!perfil || !allowedPerfis.includes(perfil))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

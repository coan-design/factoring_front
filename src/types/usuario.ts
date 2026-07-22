import type { PerfilUsuario } from '../stores/auth-store';

export type { PerfilUsuario };

/** Campos conferidos contra UsuariosService.SAFE_SELECT (factoring_api) — nunca inclui senhaHash. */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PERFIS: { key: PerfilUsuario; label: string; description: string }[] = [
  { key: 'ADMIN', label: 'ADMIN', description: 'Acesso completo: usuários, configurações e todas as operações.' },
  { key: 'OPERADOR', label: 'OPERADOR', description: 'Cadastra clientes, recebíveis, empréstimos e conduz negociações.' },
  { key: 'ANALISTA', label: 'ANALISTA', description: 'Consulta dados e acompanha negociações, sem editar cadastros.' },
];

export const PERFIL_CORES: Record<PerfilUsuario, { bg: string; color: string }> = {
  ADMIN: { bg: '#F8E7E5', color: '#A8291F' },
  OPERADOR: { bg: '#E2EEEE', color: '#1F6F72' },
  ANALISTA: { bg: '#FBF0DF', color: '#8A5A15' },
};

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

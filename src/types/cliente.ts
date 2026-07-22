import type { Endereco } from './endereco';

export type TipoCliente = 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
export type StatusCliente = 'ATIVO' | 'INATIVO';

/**
 * Campos conferidos contra o model Cliente do Prisma (factoring_api) —
 * não existe razaoSocial/nomeFantasia/inscricaoEstadual/documento no
 * backend, apenas `nome` (único, PF ou PJ) e `cpfCnpj` (único campo, sem
 * campo separado de RG/IE).
 */
export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  tipoCliente: TipoCliente;
  email: string;
  telefone: string;
  status: StatusCliente;
  enderecoId?: string | null;
  endereco?: Endereco | null;
}

export function nomeExibicaoCliente(cliente: Cliente): string {
  return cliente.nome;
}

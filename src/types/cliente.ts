import type { Endereco } from './endereco';

export type TipoCliente = 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
export type StatusCliente = 'ATIVO' | 'INATIVO';

/**
 * Nomes de campo inferidos a partir do que design/ClientesListagem.dc.html e
 * ClientesDetalhe.dc.html exibem (o contrato auditado não lista o schema
 * exato de Cliente) — confirme contra o Swagger/Prisma antes de considerar
 * definitivo. `documento` cobre CNPJ ou CPF conforme `tipoCliente`.
 */
export interface Cliente {
  id: string;
  tipoCliente: TipoCliente;
  status: StatusCliente;
  documento: string;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  nome?: string | null;
  inscricaoEstadual?: string | null;
  telefone?: string | null;
  email?: string | null;
  enderecoId: string;
  endereco?: Endereco;
}

export function nomeExibicaoCliente(cliente: Cliente): string {
  if (cliente.tipoCliente === 'PESSOA_JURIDICA') {
    return cliente.nomeFantasia || cliente.razaoSocial || cliente.documento;
  }
  return cliente.nome || cliente.documento;
}

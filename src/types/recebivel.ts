export type TipoRecebivel = 'CHEQUE' | 'DUPLICATA';
export type StatusRecebivel = 'PENDENTE' | 'NEGOCIADO' | 'QUITADO' | 'VENCIDO' | 'INADIMPLENTE';

export const STATUS_RECEBIVEL_LIST: StatusRecebivel[] = [
  'PENDENTE',
  'NEGOCIADO',
  'QUITADO',
  'VENCIDO',
  'INADIMPLENTE',
];

/**
 * Campos condicionais por tipo confirmados em
 * design/RecebiveisFormulario.dc.html: Duplicata tem número da duplicata +
 * nota fiscal + sacado (empresa devedora); Cheque tem banco + agência +
 * número do cheque + emitente. Nomes de campo inferidos do mockup —
 * confirme contra o Swagger antes de considerar definitivo.
 */
export interface Recebivel {
  id: string;
  clienteId: string;
  tipo: TipoRecebivel;
  valorNominal: number;
  valorAberto: number;
  dataVencimento: string;
  status: StatusRecebivel;
  // Duplicata
  numeroDuplicata?: string | null;
  numeroNotaFiscal?: string | null;
  sacado?: string | null;
  // Cheque
  banco?: string | null;
  agencia?: string | null;
  numeroCheque?: string | null;
  emitente?: string | null;
  cliente?: { id: string; nome: string };
}

/** Referência curta usada nas listagens (coluna "Nº / Sacado", "Número"). */
export function referenciaRecebivel(r: Recebivel): string {
  if (r.tipo === 'DUPLICATA') {
    return r.numeroDuplicata ?? r.numeroNotaFiscal ?? r.id.slice(0, 8).toUpperCase();
  }
  return r.numeroCheque ?? r.id.slice(0, 8).toUpperCase();
}

/** "Sacado" (duplicata) ou "Banco" (cheque) — quem deve ou onde o título está depositado. */
export function contraparteRecebivel(r: Recebivel): string {
  return (r.tipo === 'DUPLICATA' ? r.sacado : r.banco) ?? '—';
}

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
 * Campos conferidos contra CreateRecebivelDto/Prisma (factoring_api).
 * `dataEmissao` é obrigatório sempre. Para CHEQUE, banco/agência/conta/
 * numeroCheque/dataBomPara/emitente são todos obrigatórios; para
 * DUPLICATA, numeroNotaFiscal/aceite/sacado são obrigatórios. O campo
 * `numeroDuplicata` do mockup não existe no schema real — a referência da
 * duplicata é a própria nota fiscal (`numeroNotaFiscal`).
 */
export interface Recebivel {
  id: string;
  clienteId: string;
  tipo: TipoRecebivel;
  valorNominal: number;
  valorAberto: number;
  dataEmissao: string;
  dataVencimento: string;
  status: StatusRecebivel;
  // Duplicata
  numeroNotaFiscal?: string | null;
  aceite?: boolean | null;
  sacado?: string | null;
  // Cheque
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  numeroCheque?: string | null;
  dataBomPara?: string | null;
  emitente?: string | null;
  // Documentos anexados
  documentoFrenteUrl?: string | null;
  documentoVersoUrl?: string | null;
  cliente?: { id: string; nome: string };
  createdAt: string;
  updatedAt: string;
}

/** Referência curta usada nas listagens (coluna "Nº / Sacado", "Número"). */
export function referenciaRecebivel(r: Recebivel): string {
  if (r.tipo === 'DUPLICATA') {
    return r.numeroNotaFiscal ?? r.id.slice(0, 8).toUpperCase();
  }
  return r.numeroCheque ?? r.id.slice(0, 8).toUpperCase();
}

/** "Sacado" (duplicata) ou "Banco" (cheque) — quem deve ou onde o título está depositado. */
export function contraparteRecebivel(r: Recebivel): string {
  return (r.tipo === 'DUPLICATA' ? r.sacado : r.banco) ?? '—';
}

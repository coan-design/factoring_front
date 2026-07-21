import type { StatusRecebivel } from './recebivel';

export interface DashboardIndicadores {
  recebiveisVencidos: { valor: number; quantidade: number };
  saldoTotalAReceber: { valor: number };
  emprestimosAtivos: { quantidade: number; valor: number };
  negociacoesEmAberto: { quantidade: number; valor: number };
}

/**
 * Array pode vir em qualquer ordem e omitir status sem nenhum recebível —
 * trate ausência como 0%, nunca como erro. `percentual` já vem pronto do
 * backend (soma 100, arredondamento absorvido pelo maior grupo); não
 * recalcule a partir de `quantidade`.
 */
export interface RecebivelPorStatusItem {
  status: StatusRecebivel;
  quantidade: number;
  percentual: number;
}

/**
 * `mes` em YYYY-MM, do mais antigo ao mais recente, já preenchido com 0 nos
 * meses sem negociação (a série sempre tem o número de meses pedido, sem
 * buracos). Negociações CANCELADA já vêm excluídas do cálculo.
 */
export interface ReceitaMensalItem {
  mes: string;
  desagio: number;
  tarifas: number;
}

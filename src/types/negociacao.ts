import type { Emprestimo } from './emprestimo';
import type { Recebivel } from './recebivel';

export type StatusNegociacao = 'EM_ANALISE' | 'APROVADA' | 'FINALIZADA' | 'CANCELADA';
export type TipoNegociacao = 'RECEBIVEIS' | 'EMPRESTIMO' | 'MISTA';
export type FormaPagamento = 'PIX' | 'TED' | 'BOLETO' | 'DINHEIRO';

/**
 * Linha de listagem (GET /negociacoes). `cliente` é opcional porque o
 * include atual do backend (negociacoes.service.ts) não traz a relação —
 * ver nota no README da reference-implementation. Trate `undefined` com
 * fallback para `clienteId` até o backend incluir `cliente: true`.
 */
export interface NegociacaoResumo {
  id: string;
  numero: string;
  titulo: string;
  dataNegociacao: string;
  status: StatusNegociacao;
  tipoNegociacao: TipoNegociacao;
  valorBruto: number;
  valorAReceber: number;
  clienteId: string;
  cliente?: { id: string; nome: string };
}

export interface ItemNegociacaoRecebivel {
  id: string;
  valorConsiderado: number;
  valorDesagio: number;
  valorLiquido: number;
  recebivel: Recebivel;
}

export interface ItemNegociacaoEmprestimo {
  id: string;
  emprestimo: Emprestimo;
}

/** GET /negociacoes/:id — ver mesma nota sobre `cliente` acima. */
export interface Negociacao {
  id: string;
  numero: string;
  titulo: string;
  descricao?: string | null;
  dataNegociacao: string;
  tipoNegociacao: TipoNegociacao;
  status: StatusNegociacao;
  formaPagamento: FormaPagamento;
  valorBruto: number;
  valorTarifas: number;
  valorTotalReceber: number;
  valorPago: number;
  valorAReceber: number;
  clienteId: string;
  cliente?: { id: string; nome: string };
  itensRecebivel: ItemNegociacaoRecebivel[];
  itensEmprestimo: ItemNegociacaoEmprestimo[];
}

/**
 * Uma linha unificada da tabela "Itens incluídos" (mistura recebíveis e
 * empréstimos, como no mockup NegociacoesDetalhe.dc.html). Deriva de
 * Negociacao — não é algo que o backend devolve pronto.
 */
export interface ItemNegociacaoLinha {
  id: string;
  tipo: 'Cheque' | 'Duplicata' | 'Empréstimo';
  referencia: string;
  detalhe: string;
  bruto: number;
  aReceber: number;
  pago: number;
}

export function montarItensDaTabela(negociacao: Negociacao): ItemNegociacaoLinha[] {
  const itensRecebivel: ItemNegociacaoLinha[] = negociacao.itensRecebivel.map((item) => ({
    id: item.id,
    tipo: item.recebivel.tipo === 'CHEQUE' ? 'Cheque' : 'Duplicata',
    referencia: item.recebivel.numeroCheque ?? item.recebivel.numeroNotaFiscal ?? item.recebivel.id.slice(0, 8),
    detalhe: `Vence ${new Date(item.recebivel.dataVencimento).toLocaleDateString('pt-BR')}`,
    bruto: item.valorLiquido,
    aReceber: item.recebivel.valorNominal,
    pago: item.recebivel.valorNominal - item.recebivel.valorAberto,
  }));

  const itensEmprestimo: ItemNegociacaoLinha[] = negociacao.itensEmprestimo.map((item) => {
    const totalReceber = item.emprestimo.parcelas.reduce((soma, p) => soma + p.valor, 0);
    const pago = item.emprestimo.parcelas.reduce((soma, p) => soma + p.valorPago, 0);
    const parcelasPagas = item.emprestimo.parcelas.filter((p) => p.status === 'PAGA').length;
    return {
      id: item.id,
      tipo: 'Empréstimo',
      referencia: item.emprestimo.id.slice(0, 8).toUpperCase(),
      detalhe: `${item.emprestimo.quantidadeParcelas} parcelas · ${parcelasPagas} pagas antes da cessão`,
      bruto: item.emprestimo.valorEmprestado,
      aReceber: totalReceber,
      pago,
    };
  });

  return [...itensRecebivel, ...itensEmprestimo];
}

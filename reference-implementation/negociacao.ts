export type TipoRecebivel = 'CHEQUE' | 'DUPLICATA';
export type StatusRecebivel = 'PENDENTE' | 'NEGOCIADO' | 'QUITADO' | 'VENCIDO' | 'INADIMPLENTE';
export type StatusParcela = 'PENDENTE' | 'PAGA' | 'ATRASADA';
export type StatusNegociacao = 'EM_ANALISE' | 'APROVADA' | 'FINALIZADA' | 'CANCELADA';
export type TipoNegociacao = 'RECEBIVEIS' | 'EMPRESTIMO' | 'MISTA';
export type FormaPagamento = 'PIX' | 'TED' | 'BOLETO' | 'DINHEIRO';

export interface Recebivel {
  id: string;
  tipo: TipoRecebivel;
  valorNominal: number;
  valorAberto: number;
  dataVencimento: string;
  status: StatusRecebivel;
  // campos condicionais por tipo
  numeroNotaFiscal?: string | null;
  numeroCheque?: string | null;
  banco?: string | null;
}

export interface ParcelaEmprestimo {
  id: string;
  numero: number;
  valor: number;
  valorPago: number;
  status: StatusParcela;
}

export interface Emprestimo {
  id: string;
  valorEmprestado: number;
  quantidadeParcelas: number;
  parcelas: ParcelaEmprestimo[];
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
  cliente: { id: string; nome: string };
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

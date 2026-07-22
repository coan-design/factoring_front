export type StatusParcela = 'PENDENTE' | 'PAGA' | 'ATRASADA';
export type TipoJuros = 'SIMPLES' | 'COMPOSTO';

export interface ParcelaEmprestimo {
  id: string;
  numero: number;
  dataVencimento: string;
  valor: number;
  valorPago: number;
  status: StatusParcela;
}

/**
 * Campos conferidos contra CreateEmprestimoDto/Prisma (factoring_api).
 * `GET /emprestimos` e `GET /emprestimos/:id` não incluem a relação
 * `cliente` (sem `include` no service) — resolva o nome à parte quando
 * precisar exibi-lo.
 */
export interface Emprestimo {
  id: string;
  clienteId: string;
  dataContratacao: string;
  valorEmprestado: number;
  tipoJuros: TipoJuros;
  taxaJuros: number;
  quantidadeParcelas: number;
  contratoUrl?: string | null;
  parcelas: ParcelaEmprestimo[];
  cliente?: { id: string; nome: string };
}

/** "Ativo"/"Quitado"/"Em atraso" — não existe status no model Emprestimo; deriva das parcelas, mesma regra usada em ParcelasEmprestimoService.registrarPagamento (vencimento < hoje). */
export function statusDerivadoEmprestimo(emprestimo: Pick<Emprestimo, 'parcelas'>): 'ATIVO' | 'QUITADO' | 'EM_ATRASO' {
  if (emprestimo.parcelas.length > 0 && emprestimo.parcelas.every((p) => p.status === 'PAGA')) {
    return 'QUITADO';
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const emAtraso = emprestimo.parcelas.some((p) => p.status !== 'PAGA' && new Date(p.dataVencimento) < hoje);
  return emAtraso ? 'EM_ATRASO' : 'ATIVO';
}

/** Próxima parcela não paga a vencer (ou undefined se quitado). */
export function proximaParcelaEmprestimo(emprestimo: Pick<Emprestimo, 'parcelas'>): ParcelaEmprestimo | undefined {
  return emprestimo.parcelas
    .filter((p) => p.status !== 'PAGA')
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))[0];
}

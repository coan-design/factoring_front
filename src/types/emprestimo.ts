export type StatusParcela = 'PENDENTE' | 'PAGA' | 'ATRASADA';

export interface ParcelaEmprestimo {
  id: string;
  numero: number;
  dataVencimento: string;
  valor: number;
  valorPago: number;
  status: StatusParcela;
}

export interface Emprestimo {
  id: string;
  clienteId: string;
  dataContratacao: string;
  valorEmprestado: number;
  quantidadeParcelas: number;
  parcelas: ParcelaEmprestimo[];
  cliente?: { id: string; nome: string };
}

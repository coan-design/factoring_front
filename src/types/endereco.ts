/** Campos conferidos contra CreateEnderecoDto/Prisma (factoring_api). */
export interface Endereco {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export type EnderecoPayload = Omit<Endereco, 'id'>;

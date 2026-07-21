import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Paginated } from '../../../types/common';
import type { Emprestimo } from '../../../types/emprestimo';
import type { FormaPagamento, Negociacao, TipoNegociacao } from '../../../types/negociacao';
import type { Cliente } from '../../../types/cliente';
import type { Recebivel } from '../../../types/recebivel';

/** Busca de cliente (passo 1) — usa o filtro `busca` real de GET /clientes. */
export function useClientesBusca(busca: string) {
  return useQuery({
    queryKey: ['clientes', 'busca-wizard', busca],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Cliente>>('/clientes', {
        params: { status: 'ATIVO', busca, page: 1, pageSize: 20 },
      });
      return data.data;
    },
    enabled: busca.length > 0,
  });
}

/** Recebíveis e empréstimos elegíveis do cliente selecionado (passo 2). */
export function useItensDisponiveisCliente(clienteId: string) {
  const recebiveis = useQuery({
    queryKey: ['recebiveis', 'disponiveis', clienteId],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Recebivel>>('/recebiveis', {
        params: { clienteId, status: 'PENDENTE', page: 1, pageSize: 100 },
      });
      return data.data;
    },
    enabled: !!clienteId,
  });

  const emprestimos = useQuery({
    queryKey: ['emprestimos', 'disponiveis', clienteId],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Emprestimo>>('/emprestimos', {
        params: { clienteId, comSaldoDevedor: true, page: 1, pageSize: 100 },
      });
      return data.data;
    },
    enabled: !!clienteId,
  });

  return {
    recebiveis: recebiveis.data ?? [],
    emprestimos: emprestimos.data ?? [],
    isLoading: recebiveis.isLoading || emprestimos.isLoading,
  };
}

export interface CriarNegociacaoPayload {
  numero: string;
  titulo: string;
  descricao?: string;
  clienteId: string;
  tipoNegociacao: TipoNegociacao;
  formaPagamento: FormaPagamento;
}

export function useCriarNegociacao() {
  return useMutation({
    mutationFn: async (payload: CriarNegociacaoPayload) => {
      const { data } = await apiClient.post<Negociacao>('/negociacoes', payload);
      return data;
    },
  });
}

/**
 * Recebe `negociacaoId` nas variáveis da mutation (não como parâmetro do
 * hook) de propósito: é chamado logo depois de `useCriarNegociacao` criar o
 * registro, dentro do mesmo handler — o estado do componente ainda não
 * re-renderizou com o novo id, então um hook parametrizado por `negociacaoId`
 * capturaria o valor antigo (closure desatualizada).
 */
export function useAdicionarItemRecebivel() {
  return useMutation({
    mutationFn: async (payload: {
      negociacaoId: string;
      recebivelId: string;
      quantidadeDias: number;
      taxaDesagio: number;
    }) => {
      const { negociacaoId, ...body } = payload;
      const { data } = await apiClient.post(`/negociacoes/${negociacaoId}/itens-recebivel`, body);
      return data;
    },
  });
}

export function useAdicionarItemEmprestimo() {
  return useMutation({
    mutationFn: async (payload: { negociacaoId: string; emprestimoId: string }) => {
      const { negociacaoId, ...body } = payload;
      const { data } = await apiClient.post(`/negociacoes/${negociacaoId}/itens-emprestimo`, body);
      return data;
    },
  });
}

/**
 * Não documentado explicitamente no contrato — inferido por analogia ao
 * padrão de atualização genérica já usado em clientes (PATCH /clientes/:id).
 * Confirme o path exato contra o Swagger.
 */
export function useAtualizarTarifasNegociacao(negociacaoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valorTarifas: number) => {
      const { data } = await apiClient.patch<Negociacao>(`/negociacoes/${negociacaoId}`, { valorTarifas });
      return data;
    },
    onSuccess: (negociacao) => {
      queryClient.setQueryData(['negociacoes', negociacaoId], negociacao);
    },
  });
}

export function useAprovarNegociacao(negociacaoId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch<Negociacao>(`/negociacoes/${negociacaoId}/aprovar`);
      return data;
    },
  });
}

/**
 * Não documentado explicitamente — inferido por analogia a `/aprovar` e
 * `/finalizar`, e pela própria existência do status CANCELADA no enum.
 * Usado para permitir abandonar o wizard sem deixar uma negociação em
 * EM_ANALISE órfã. Confirme o path exato contra o Swagger.
 */
export function useCancelarNegociacao(negociacaoId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch<Negociacao>(`/negociacoes/${negociacaoId}/cancelar`);
      return data;
    },
  });
}

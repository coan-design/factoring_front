import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { Pagination } from '../../../components/shared/Pagination';
import { StatusBadge, STATUS_NEGOCIACAO_TONE } from '../../../components/shared/StatusBadge';
import { Th } from '../../../components/shared/Th';
import { formatarData, formatarMoeda } from '../../../lib/format';
import type { StatusNegociacao } from '../../../types/negociacao';
import { useNegociacoesListagem, useNomesClientes } from '../hooks/useNegociacoes';

/**
 * Tradução de design/NegociacoesListagem.dc.html. GET /negociacoes não tem
 * busca por texto (só clienteId/status/tipoNegociacao) — mesmo padrão de
 * campo desabilitado já usado em Recebíveis e Empréstimos. `status` é um
 * filtro real do backend.
 */
export function NegociacoesListPage() {
  const [status, setStatus] = useState<StatusNegociacao | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useNegociacoesListagem({ page, status: status || undefined });
  const nomesPorId = useNomesClientes((data?.data ?? []).map((n) => n.clienteId));

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">Início / Negociações</div>
          <h1 className="mt-0.5 font-display text-2xl font-semibold">Negociações</h1>
        </div>
        <Link
          to="/negociacoes/novo"
          className="flex items-center gap-1.5 rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova negociação
        </Link>
      </div>

      <div className="px-10 py-8">
        <div className="mb-5 flex gap-3">
          <div className="relative max-w-[340px] flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8B9493"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              disabled
              title="Busca por texto ainda não é suportada pela API (GET /negociacoes aceita apenas clienteId, status e tipoNegociacao)"
              placeholder="Buscar por número, título ou cliente"
              className="w-full cursor-not-allowed rounded-control border border-border bg-[#F7F8F7] py-2.5 pl-9 pr-3 text-[13.5px] text-muted"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusNegociacao | '');
              setPage(1);
            }}
            className="rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px] text-grafite-texto"
          >
            <option value="">Todos os status</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="APROVADA">Em andamento</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-panel border border-border bg-surface">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr className="bg-surface-sunken">
                <Th>Negociação</Th>
                <Th>Cliente</Th>
                <Th>Aberta em</Th>
                <Th align="right">Valor bruto</Th>
                <Th align="right">A receber</Th>
                <Th>Status</Th>
                <Th align="right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-[13px] text-muted">
                    Carregando…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-[13px] text-muted">
                    Nenhuma negociação encontrada.
                  </td>
                </tr>
              )}
              {data?.data.map((negociacao) => {
                const statusInfo = STATUS_NEGOCIACAO_TONE[negociacao.status] ?? {
                  label: negociacao.status,
                  tone: 'neutral' as const,
                };
                const aReceberColor =
                  negociacao.status === 'FINALIZADA' || negociacao.valorAReceber === 0 ? '#4B5453' : '#9A5B13';
                return (
                  <tr key={negociacao.id} className="border-b border-border-subtle hover:bg-surface-sunken">
                    <td className="px-5 py-3.5">
                      <div className="tabnum font-mono text-[13.5px] font-semibold text-petroleo-tinta">
                        {negociacao.numero}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">{negociacao.titulo}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px]">
                      {nomesPorId[negociacao.clienteId] ?? negociacao.clienteId}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-[13.5px] text-muted-foreground">
                      {formatarData(negociacao.dataNegociacao)}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-right font-mono text-[13.5px]">
                      {formatarMoeda(negociacao.valorBruto)}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-right font-mono text-[13.5px] font-semibold" style={{ color: aReceberColor }}>
                      {formatarMoeda(negociacao.valorAReceber)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/negociacoes/${negociacao.id}`}
                        className="rounded-control bg-[#EFF4F4] px-3 py-1.5 text-[12.5px] font-medium text-petroleo-interativo no-underline"
                      >
                        Ver detalhe
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data && (
            <Pagination page={page} pageSize={data.pageSize} total={data.total} itemLabel="negociações" onPageChange={setPage} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

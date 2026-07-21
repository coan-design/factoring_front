import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { Pagination } from '../../../components/shared/Pagination';
import { StatusBadge, STATUS_RECEBIVEL_TONE } from '../../../components/shared/StatusBadge';
import { Th } from '../../../components/shared/Th';
import { formatarData, formatarMoeda } from '../../../lib/format';
import { referenciaRecebivel, type StatusRecebivel, type TipoRecebivel } from '../../../types/recebivel';
import { useRecebiveis } from '../hooks/useRecebiveis';

/** Tradução de design/RecebiveisListagem.dc.html. */
export function RecebiveisListPage() {
  const [status, setStatus] = useState<StatusRecebivel | ''>('');
  const [tipo, setTipo] = useState<TipoRecebivel | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useRecebiveis({
    page,
    status: status || undefined,
    tipo: tipo || undefined,
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">Início / Recebíveis</div>
          <h1 className="mt-0.5 font-display text-2xl font-semibold">Recebíveis</h1>
        </div>
        <Link
          to="/recebiveis/novo"
          className="flex items-center gap-1.5 rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo recebível
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
              title="Busca por texto ainda não é suportada pela API (/recebiveis aceita apenas clienteId, status, tipo e intervalo de vencimento)"
              placeholder="Buscar por cliente, número ou nota fiscal"
              className="w-full cursor-not-allowed rounded-control border border-border bg-[#F7F8F7] py-2.5 pl-9 pr-3 text-[13.5px] text-muted"
            />
          </div>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoRecebivel | '');
              setPage(1);
            }}
            className="rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px] text-grafite-texto"
          >
            <option value="">Todos os tipos</option>
            <option value="CHEQUE">Cheque</option>
            <option value="DUPLICATA">Duplicata</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusRecebivel | '');
              setPage(1);
            }}
            className="rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px] text-grafite-texto"
          >
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="VENCIDO">Vencido</option>
            <option value="QUITADO">Pago</option>
            <option value="NEGOCIADO">Cedido</option>
            <option value="INADIMPLENTE">Inadimplente</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-panel border border-border bg-surface">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-sunken">
                <Th>Tipo</Th>
                <Th>Cliente</Th>
                <Th>Número</Th>
                <Th>Vencimento</Th>
                <Th align="right">Valor</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-[13px] text-muted">
                    Carregando…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-[13px] text-muted">
                    Nenhum recebível encontrado.
                  </td>
                </tr>
              )}
              {data?.data.map((r) => {
                const statusInfo = STATUS_RECEBIVEL_TONE[r.status] ?? { label: r.status, tone: 'neutral' as const };
                const vencido = r.status === 'VENCIDO';
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border-subtle hover:bg-[#F7EDEC]"
                    style={{ background: vencido ? '#FBF1F0' : undefined }}
                  >
                    <td className="px-5 py-3.5 text-[13px] text-muted-foreground">
                      {r.tipo === 'DUPLICATA' ? 'Duplicata' : 'Cheque'}
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] font-medium">
                      {r.cliente?.nome ?? r.clienteId}
                    </td>
                    <td className="tabnum px-5 py-3.5 font-mono text-[13px] text-muted-foreground">
                      {referenciaRecebivel(r)}
                    </td>
                    <td
                      className="tabnum px-5 py-3.5 text-[13.5px]"
                      style={{ color: vencido ? '#A8291F' : '#4B5453', fontWeight: vencido ? 700 : 400 }}
                    >
                      {formatarData(r.dataVencimento)}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-right font-mono text-[13.5px] font-semibold">
                      {formatarMoeda(r.valorNominal)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data && (
            <Pagination
              page={page}
              pageSize={data.pageSize}
              total={data.total}
              itemLabel="recebíveis"
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

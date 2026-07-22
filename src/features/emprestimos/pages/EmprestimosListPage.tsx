import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { Pagination } from '../../../components/shared/Pagination';
import { StatusBadge, STATUS_EMPRESTIMO_TONE } from '../../../components/shared/StatusBadge';
import { Th } from '../../../components/shared/Th';
import { formatarData, formatarMoeda } from '../../../lib/format';
import { proximaParcelaEmprestimo, statusDerivadoEmprestimo } from '../../../types/emprestimo';
import { useEmprestimos, useNomesClientes } from '../hooks/useEmprestimos';

type FiltroStatus = '' | 'ATIVO' | 'QUITADO';

/**
 * Tradução de design/EmprestimosListagem.dc.html. A API não tem busca por
 * texto nem uma partição de "em atraso" em GET /emprestimos (só
 * comSaldoDevedor true/false) — mesmo padrão de RecebiveisListPage: campo de
 * busca desabilitado com explicação, filtro de status limitado ao que o
 * backend realmente particiona, e "Em atraso" tratado como destaque visual
 * (derivado das parcelas), não como filtro.
 */
export function EmprestimosListPage() {
  const [status, setStatus] = useState<FiltroStatus>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useEmprestimos({
    page,
    comSaldoDevedor: status === 'ATIVO' ? true : status === 'QUITADO' ? false : undefined,
  });
  const { nomesPorId } = useNomesClientes((data?.data ?? []).map((e) => e.clienteId));

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">Início / Empréstimos</div>
          <h1 className="mt-0.5 font-display text-2xl font-semibold">Empréstimos</h1>
        </div>
        <Link
          to="/emprestimos/novo"
          className="flex items-center gap-1.5 rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo empréstimo
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
              title="Busca por texto ainda não é suportada pela API (GET /emprestimos aceita apenas clienteId e comSaldoDevedor)"
              placeholder="Buscar por cliente ou número do contrato"
              className="w-full cursor-not-allowed rounded-control border border-border bg-[#F7F8F7] py-2.5 pl-9 pr-3 text-[13.5px] text-muted"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as FiltroStatus);
              setPage(1);
            }}
            className="rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px] text-grafite-texto"
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="QUITADO">Quitado</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-panel border border-border bg-surface">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-surface-sunken">
                <Th>Contrato</Th>
                <Th>Cliente</Th>
                <Th align="right">Valor emprestado</Th>
                <Th>Parcelas</Th>
                <Th>Próx. vencimento</Th>
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
                    Nenhum empréstimo encontrado.
                  </td>
                </tr>
              )}
              {data?.data.map((emprestimo) => {
                const statusDerivado = statusDerivadoEmprestimo(emprestimo);
                const statusInfo = STATUS_EMPRESTIMO_TONE[statusDerivado];
                const emAtraso = statusDerivado === 'EM_ATRASO';
                const parcelasPagas = emprestimo.parcelas.filter((p) => p.status === 'PAGA').length;
                const proxima = proximaParcelaEmprestimo(emprestimo);
                return (
                  <tr
                    key={emprestimo.id}
                    className="border-b border-border-subtle hover:bg-[#F7EDEC]"
                    style={{ background: emAtraso ? '#FBF1F0' : undefined }}
                  >
                    <td className="tabnum px-5 py-3.5 font-mono text-[13.5px]">
                      {emprestimo.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] font-medium">
                      {nomesPorId[emprestimo.clienteId] ?? emprestimo.clienteId}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-right font-mono text-[13.5px] font-semibold">
                      {formatarMoeda(emprestimo.valorEmprestado)}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-[13.5px] text-muted-foreground">
                      {parcelasPagas} de {emprestimo.quantidadeParcelas}
                    </td>
                    <td
                      className="tabnum px-5 py-3.5 text-[13.5px]"
                      style={{ color: emAtraso ? '#A8291F' : '#4B5453', fontWeight: emAtraso ? 700 : 400 }}
                    >
                      {proxima ? formatarData(proxima.dataVencimento) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/emprestimos/${emprestimo.id}`}
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
            <Pagination page={page} pageSize={data.pageSize} total={data.total} itemLabel="empréstimos" onPageChange={setPage} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

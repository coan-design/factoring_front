import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { StatusBadge, STATUS_PARCELA_TONE } from '../../../components/shared/StatusBadge';
import { Th } from '../../../components/shared/Th';
import { formatarData, formatarMoeda } from '../../../lib/format';
import {
  useEmprestimo,
  useMarcarPagamentoParcela,
  useSaldoDevedorEmprestimo,
  useValorTotalEmprestimo,
} from '../hooks/useEmprestimo';

/** Tradução 1:1 de design/EmprestimosDetalhe.dc.html. */
export function EmprestimoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: emprestimo, isLoading, isError } = useEmprestimo(id!);
  const valorTotal = useValorTotalEmprestimo(id!);
  const saldoDevedor = useSaldoDevedorEmprestimo(id!);
  const marcarPagamento = useMarcarPagamentoParcela(id!);

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse px-10 py-8">
          <div className="mb-6 h-6 w-64 rounded bg-border-subtle" />
          <div className="h-64 rounded-panel bg-border-subtle" />
        </div>
      </AppShell>
    );
  }

  if (isError || !emprestimo) {
    return (
      <AppShell>
        <div className="p-10 text-sm text-muted">
          Não foi possível carregar este empréstimo. Verifique o link ou tente novamente.
        </div>
      </AppShell>
    );
  }

  const parcelasPagas = emprestimo.parcelas.filter((p) => p.status === 'PAGA').length;
  const proximaParcela = emprestimo.parcelas
    .filter((p) => p.status !== 'PAGA')
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))[0];

  // Deriva "Ativo"/"Quitado" do saldo devedor — o empréstimo não tem um campo de status próprio no contrato,
  // apenas o filtro comSaldoDevedor, que é exatamente esse mesmo conceito.
  const emAberto = (saldoDevedor.data ?? 0) > 0;
  const statusInfo = saldoDevedor.isLoading
    ? { label: '—', tone: 'neutral' as const }
    : emAberto
      ? { label: 'Ativo', tone: 'info' as const }
      : { label: 'Quitado', tone: 'success' as const };

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">
            <Link to="/emprestimos" className="text-petroleo-interativo no-underline hover:text-petroleo-tinta">
              Empréstimos
            </Link>{' '}
            / {emprestimo.id.slice(0, 8).toUpperCase()}
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold">
              Empréstimo {emprestimo.id.slice(0, 8).toUpperCase()}
            </h1>
            <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
          </div>
        </div>
        <Link
          to={`/emprestimos/${emprestimo.id}/editar`}
          className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium no-underline"
        >
          Editar contrato
        </Link>
      </div>

      <div className="px-10 py-8">
        <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[18px]">
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-[12.5px] text-muted">Cliente</div>
            <div className="mt-1.5 text-base font-semibold">{emprestimo.cliente?.nome ?? emprestimo.clienteId}</div>
          </div>
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-[12.5px] text-muted">Valor emprestado (bruto)</div>
            <div className="tabnum mt-1.5 font-mono text-xl font-semibold text-petroleo-tinta">
              {formatarMoeda(emprestimo.valorEmprestado)}
            </div>
          </div>
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-[12.5px] text-muted">Total a receber (principal + juros)</div>
            <div className="tabnum mt-1.5 font-mono text-xl font-semibold">
              {valorTotal.isLoading ? '—' : formatarMoeda(valorTotal.data ?? 0)}
            </div>
          </div>
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-[12.5px] text-muted">Saldo devedor</div>
            <div className="tabnum mt-1.5 font-mono text-xl font-semibold text-ambar-atencao">
              {saldoDevedor.isLoading ? '—' : formatarMoeda(saldoDevedor.data ?? 0)}
            </div>
          </div>
        </div>

        <div className="relative mb-7 overflow-hidden rounded-panel border border-border bg-surface p-[22px]">
          <LedgerCorner tone="neutral" />
          <div className="mb-3.5 text-[13px] font-semibold">Dados do contrato</div>
          <div className="grid grid-cols-4 gap-x-[18px] gap-y-3.5">
            <div>
              <div className="text-[11.5px] text-muted">Data de contratação</div>
              <div className="tabnum mt-0.5 font-mono text-[13.5px]">{formatarData(emprestimo.dataContratacao)}</div>
            </div>
            <div>
              <div className="text-[11.5px] text-muted">Nº de parcelas</div>
              <div className="tabnum mt-0.5 font-mono text-[13.5px]">{emprestimo.quantidadeParcelas}</div>
            </div>
            <div>
              <div className="text-[11.5px] text-muted">Parcelas pagas</div>
              <div className="tabnum mt-0.5 font-mono text-[13.5px]">
                {parcelasPagas} de {emprestimo.quantidadeParcelas}
              </div>
            </div>
            <div>
              <div className="text-[11.5px] text-muted">Próximo vencimento</div>
              <div className="tabnum mt-0.5 font-mono text-[13.5px] font-semibold text-ambar-atencao">
                {proximaParcela ? formatarData(proximaParcela.dataVencimento) : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-panel border border-border bg-surface">
          <div className="border-b border-border px-5 py-[18px] text-[15px] font-semibold">Parcelas</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-sunken">
                <Th>Parcela</Th>
                <Th>Vencimento</Th>
                <Th align="right">Valor</Th>
                <Th>Status</Th>
                <Th align="right">Ação</Th>
              </tr>
            </thead>
            <tbody>
              {emprestimo.parcelas.map((parcela) => {
                const statusInfo = STATUS_PARCELA_TONE[parcela.status] ?? {
                  label: parcela.status,
                  tone: 'neutral' as const,
                };
                return (
                  <tr key={parcela.id} className="border-b border-border-subtle hover:bg-surface-sunken">
                    <td className="tabnum px-5 py-3.5 font-mono text-[13.5px]">
                      {parcela.numero} / {emprestimo.quantidadeParcelas}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-[13.5px] text-muted-foreground">
                      {formatarData(parcela.dataVencimento)}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-right font-mono text-[13.5px] font-semibold">
                      {formatarMoeda(parcela.valor)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {parcela.status !== 'PAGA' && (
                        <button
                          type="button"
                          disabled={marcarPagamento.isPending}
                          onClick={() => marcarPagamento.mutate(parcela.id)}
                          className="rounded-control bg-[#EFF4F4] px-3 py-1.5 text-[12.5px] font-medium text-petroleo-interativo disabled:opacity-60"
                        >
                          Marcar pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

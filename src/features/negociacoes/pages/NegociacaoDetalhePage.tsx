import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { StatusBadge, STATUS_NEGOCIACAO_TONE } from '../../../components/shared/StatusBadge';
import { Th } from '../../../components/shared/Th';
import { formatarData, formatarMoeda } from '../../../lib/format';
import { useAuthStore } from '../../../stores/auth-store';
import { montarItensDaTabela } from '../../../types/negociacao';
import { useFinalizarNegociacao, useNegociacao } from '../hooks/useNegociacao';

const PODE_FINALIZAR = new Set(['ADMIN', 'OPERADOR']);

/** Tradução 1:1 de design/NegociacoesDetalhe.dc.html (portada da reference-implementation/). */
export function NegociacaoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const perfil = useAuthStore((s) => s.usuario?.perfil);
  const { data: negociacao, isLoading, isError } = useNegociacao(id!);
  const finalizar = useFinalizarNegociacao(id!);

  if (isLoading) {
    return (
      <AppShell>
        <DetalheSkeleton />
      </AppShell>
    );
  }

  if (isError || !negociacao) {
    return (
      <AppShell>
        <div className="p-10 text-sm text-muted">
          Não foi possível carregar esta negociação. Verifique o link ou tente novamente.
        </div>
      </AppShell>
    );
  }

  const itens = montarItensDaTabela(negociacao);
  const saldoZero = negociacao.valorAReceber === 0;
  const podeFinalizar = saldoZero && PODE_FINALIZAR.has(perfil ?? '') && negociacao.status === 'APROVADA';
  const percentualPago =
    negociacao.valorTotalReceber > 0 ? Math.round((negociacao.valorPago / negociacao.valorTotalReceber) * 100) : 0;
  const statusInfo = STATUS_NEGOCIACAO_TONE[negociacao.status] ?? { label: negociacao.status, tone: 'neutral' as const };

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">
            <Link to="/negociacoes" className="text-petroleo-interativo no-underline hover:text-petroleo-tinta">
              Negociações
            </Link>{' '}
            / {negociacao.numero}
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold">{negociacao.titulo}</h1>
            <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
          </div>
          <div className="mt-1 text-[13px] text-muted">
            {negociacao.numero} · {negociacao.cliente?.nome ?? negociacao.clienteId} · aberta em{' '}
            {formatarData(negociacao.dataNegociacao)}
          </div>
        </div>

        <button
          type="button"
          disabled={!podeFinalizar || finalizar.isPending}
          onClick={() => finalizar.mutate()}
          title={
            !saldoZero
              ? 'Disponível quando o valor a receber chegar a R$ 0,00'
              : !PODE_FINALIZAR.has(perfil ?? '')
                ? 'Seu perfil não tem permissão para finalizar negociações'
                : undefined
          }
          className={`rounded-control px-4 py-2.5 font-sans text-[13.5px] font-semibold transition-colors ${
            podeFinalizar
              ? 'cursor-pointer bg-petroleo-interativo text-white hover:bg-petroleo-tinta'
              : 'cursor-not-allowed bg-[#EDEFEE] text-[#9AA3A1]'
          }`}
        >
          {finalizar.isPending ? 'Finalizando…' : 'Finalizar negociação'}
        </button>
      </div>

      <div className="px-10 py-8">
        <div className="mb-3.5 grid grid-cols-2 gap-3.5">
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-xs text-muted">Valor bruto (desembolsado)</div>
            <div className="tabnum mt-1.5 font-mono text-xl font-bold text-petroleo-tinta">
              {formatarMoeda(negociacao.valorBruto)}
            </div>
          </div>
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-xs text-muted">Valor total a receber</div>
            <div className="tabnum mt-1.5 font-mono text-xl font-bold">
              {formatarMoeda(negociacao.valorTotalReceber)}
            </div>
          </div>
        </div>

        <div className="relative mb-7 overflow-hidden rounded-panel border border-border bg-surface p-[22px]">
          <LedgerCorner tone="attention" />

          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <div className="text-[13.5px] font-medium">(–) Tarifas operacionais</div>
              <div className="mt-0.5 text-[11.5px] text-muted">Custos adicionais, à parte de juros/deságio</div>
            </div>
            <div className="tabnum font-mono text-sm text-vermelho-critico">
              – {formatarMoeda(negociacao.valorTarifas)}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-border-subtle py-4">
            <div>
              <div className="text-[13.5px] font-medium">Valor já pago</div>
              <div className="mt-0.5 text-[11.5px] text-muted">
                Inclui pagamentos anteriores à negociação (parcelas do empréstimo já quitadas antes da cessão)
              </div>
            </div>
            <div className="tabnum font-mono text-sm text-muted-foreground">{formatarMoeda(negociacao.valorPago)}</div>
          </div>

          <div className="pt-[18px]">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-bold">Valor a receber (saldo)</div>
              <div className="tabnum font-mono text-[22px] font-bold text-ambar-atencao">
                {formatarMoeda(negociacao.valorAReceber)}
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border-subtle">
              <div
                className="h-full rounded-full bg-petroleo-interativo"
                style={{ width: `${Math.min(percentualPago, 100)}%` }}
              />
            </div>
            <div className="mt-1.5 text-[11.5px] text-muted">
              {percentualPago}% do valor total a receber já pago
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-panel border border-border bg-surface">
          <div className="border-b border-border px-5 py-[18px] text-[15px] font-semibold">Itens incluídos</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-sunken">
                <Th>Item</Th>
                <Th>Detalhe</Th>
                <Th align="right">Bruto</Th>
                <Th align="right">A receber</Th>
                <Th>Progresso</Th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const pct = item.aReceber > 0 ? Math.round((item.pago / item.aReceber) * 100) : 0;
                const progressColor = pct === 100 ? '#2F6D3B' : pct > 0 ? '#1F6F72' : '#C7CDCC';
                return (
                  <tr key={item.id} className="border-b border-border-subtle hover:bg-surface-sunken">
                    <td className="px-5 py-3.5">
                      <div className="text-[13.5px] font-semibold">{item.tipo}</div>
                      <div className="tabnum mt-0.5 font-mono text-xs text-muted">{item.referencia}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{item.detalhe}</td>
                    <td className="tabnum px-5 py-3.5 text-right font-mono text-[13.5px]">
                      {formatarMoeda(item.bruto)}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-right font-mono text-[13.5px] font-semibold">
                      {formatarMoeda(item.aReceber)}
                    </td>
                    <td className="w-40 px-5 py-3.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-border-subtle">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: progressColor }}
                        />
                      </div>
                      <div className="mt-1 text-[11px] text-muted">{pct}% pago</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3.5 text-[12.5px] text-muted">
          A ação "Finalizar negociação" habilita quando o valor a receber chegar a R$&nbsp;0,00.
        </div>
      </div>
    </AppShell>
  );
}

function DetalheSkeleton() {
  return (
    <div className="animate-pulse px-10 py-8">
      <div className="mb-6 h-6 w-64 rounded bg-border-subtle" />
      <div className="mb-3.5 grid grid-cols-2 gap-3.5">
        <div className="h-24 rounded-panel bg-border-subtle" />
        <div className="h-24 rounded-panel bg-border-subtle" />
      </div>
      <div className="mb-7 h-48 rounded-panel bg-border-subtle" />
      <div className="h-64 rounded-panel bg-border-subtle" />
    </div>
  );
}

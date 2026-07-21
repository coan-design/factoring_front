import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { STATUS_RECEBIVEL_TONE, StatusBadge, STATUS_NEGOCIACAO_TONE, TONE_STYLES } from '../../../components/shared/StatusBadge';
import { Th } from '../../../components/shared/Th';
import { formatarData, formatarMoeda } from '../../../lib/format';
import { useDashboardIndicadores } from '../hooks/useDashboardIndicadores';
import { useNegociacoesRecentes } from '../hooks/useDashboard';
import { useRecebiveisPorStatus } from '../hooks/useRecebiveisPorStatus';
import { useReceitaMensal } from '../hooks/useReceitaMensal';

function nomeMesAbreviado(mes: string): string {
  const [ano, mesNum] = mes.split('-').map(Number);
  const data = new Date(ano, mesNum - 1, 1);
  const nome = data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function construirGrafico(valores: number[]) {
  const w = 560;
  const h = 180;
  const pad = 8;
  if (valores.length === 0) {
    return { line: '', area: '', points: [] as { x: number; y: number }[], gridLines: [0, 1, 2, 3].map((i) => ({ y: pad + i * ((h - pad * 2) / 3) })) };
  }
  const max = Math.max(...valores);
  const min = Math.min(...valores) * 0.85;
  const divisor = max - min || 1;
  const stepX = valores.length > 1 ? w / (valores.length - 1) : 0;
  const points = valores.map((v, i) => ({
    x: i * stepX,
    y: pad + (h - pad * 2) * (1 - (v - min) / divisor),
  }));
  const line = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const ultimo = points[points.length - 1];
  const area = `${line} L${ultimo.x},${h} L0,${h} Z`;
  const gridLines = [0, 1, 2, 3].map((i) => ({ y: pad + i * ((h - pad * 2) / 3) }));
  return { line, area, points, gridLines };
}

/** Tradução de design/Dashboard.dc.html — agora com os 3 endpoints reais de GET /dashboard/*. */
export function DashboardPage() {
  const indicadores = useDashboardIndicadores();
  const statusMix = useRecebiveisPorStatus();
  const receitaMensal = useReceitaMensal();
  const recentes = useNegociacoesRecentes();

  const totaisPorMes = receitaMensal.data?.map((m) => m.desagio + m.tarifas) ?? [];
  const grafico = construirGrafico(totaisPorMes);
  const primeiroMes = totaisPorMes[0] ?? 0;
  const ultimoMes = totaisPorMes[totaisPorMes.length - 1] ?? 0;
  const crescimentoTexto =
    receitaMensal.data && primeiroMes > 0
      ? `${ultimoMes - primeiroMes >= 0 ? '+' : ''}${(((ultimoMes - primeiroMes) / primeiroMes) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% em ${totaisPorMes.length} meses`
      : null;

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">Início</div>
          <h1 className="mt-0.5 font-display text-2xl font-semibold">Dashboard</h1>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium"
          >
            Últimos 30 dias
          </button>
          <Link
            to="/negociacoes/novo"
            className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline"
          >
            Nova negociação
          </Link>
        </div>
      </div>

      <div className="px-10 py-8">
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
          <KpiCard
            label="Negociações abertas"
            corner="neutral"
            isLoading={indicadores.isLoading}
            value={indicadores.data && formatarMoeda(indicadores.data.negociacoesEmAberto.valor)}
            footnote={indicadores.data && `${indicadores.data.negociacoesEmAberto.quantidade} negociações em andamento`}
          />
          <KpiCard
            label="Recebíveis vencidos"
            corner="critical"
            isLoading={indicadores.isLoading}
            value={indicadores.data && formatarMoeda(indicadores.data.recebiveisVencidos.valor)}
            valueClassName="text-vermelho-critico"
            footnote={indicadores.data && `${indicadores.data.recebiveisVencidos.quantidade} títulos em atraso`}
          />
          <KpiCard
            label="Empréstimos ativos"
            corner="interactive"
            isLoading={indicadores.isLoading}
            value={indicadores.data && formatarMoeda(indicadores.data.emprestimosAtivos.valor)}
            footnote={indicadores.data && `${indicadores.data.emprestimosAtivos.quantidade} contratos vigentes`}
          />
          <KpiCard
            label="Saldo total a receber"
            corner="inverted"
            dark
            isLoading={indicadores.isLoading}
            value={indicadores.data && formatarMoeda(indicadores.data.saldoTotalAReceber.valor)}
            footnote="Considerando todas as carteiras"
          />
        </div>

        <div className="mb-6 grid grid-cols-[1.4fr_1fr] gap-[18px]">
          <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[22px]">
            <LedgerCorner tone="neutral" />
            <div className="mb-1 flex items-baseline justify-between">
              <div className="text-[13.5px] font-semibold">Receita de operações (deságio + tarifas)</div>
              {crescimentoTexto && (
                <div className="tabnum font-mono text-[13px] font-semibold text-petroleo-interativo">
                  {crescimentoTexto}
                </div>
              )}
            </div>
            {receitaMensal.isLoading ? (
              <div className="mt-3 h-[180px] animate-pulse rounded bg-border-subtle" />
            ) : (
              <>
                <svg viewBox="0 0 560 180" width="100%" height="180" className="mt-3 overflow-visible">
                  {grafico.gridLines.map((gl, i) => (
                    <line key={i} x1="0" y1={gl.y} x2="560" y2={gl.y} stroke="#EEF0EF" strokeWidth="1" />
                  ))}
                  <path d={grafico.area} fill="#1F6F72" fillOpacity="0.08" stroke="none" />
                  <path d={grafico.line} fill="none" stroke="#1F6F72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {grafico.points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#123B3D" stroke="white" strokeWidth="1.5" />
                  ))}
                </svg>
                <div className="mt-1.5 flex justify-between">
                  {receitaMensal.data?.map((m) => (
                    <div key={m.mes} className="text-[11px] text-muted">
                      {nomeMesAbreviado(m.mes)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[22px]">
            <LedgerCorner tone="neutral" />
            <div className="mb-4 text-[13.5px] font-semibold">Recebíveis por status</div>
            {statusMix.isLoading ? (
              <div className="text-[13px] text-muted">Carregando…</div>
            ) : (
              <>
                <div className="flex h-3.5 overflow-hidden rounded">
                  {statusMix.data?.map((s) => {
                    const tone = STATUS_RECEBIVEL_TONE[s.status]?.tone ?? 'neutral';
                    return (
                      <div key={s.status} style={{ width: `${s.percentual}%`, background: TONE_STYLES[tone].fg }} />
                    );
                  })}
                </div>
                <div className="mt-[18px] flex flex-col gap-2.5">
                  {statusMix.data?.map((s) => {
                    const tone = STATUS_RECEBIVEL_TONE[s.status]?.tone ?? 'neutral';
                    const label = STATUS_RECEBIVEL_TONE[s.status]?.label ?? s.status;
                    return (
                      <div key={s.status} className="flex items-center justify-between text-[13px]">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-sm" style={{ background: TONE_STYLES[tone].fg }} />
                          <span>{label}</span>
                        </div>
                        <span className="tabnum font-mono text-muted-foreground">{s.percentual}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-panel border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-[18px]">
            <div className="text-[15px] font-semibold">Negociações recentes</div>
            <Link to="/negociacoes" className="text-[13px] font-medium no-underline">
              Ver todas
            </Link>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-sunken">
                <Th>Negociação</Th>
                <Th>Cliente</Th>
                <Th>Data</Th>
                <Th align="right">Valor líquido</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recentes.isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-[13px] text-muted">
                    Carregando…
                  </td>
                </tr>
              )}
              {recentes.data?.data.map((row) => {
                const statusInfo = STATUS_NEGOCIACAO_TONE[row.status] ?? { label: row.status, tone: 'neutral' as const };
                return (
                  <tr key={row.id} className="border-b border-border-subtle hover:bg-surface-sunken">
                    <td className="px-5 py-3.5 text-[13.5px] font-medium text-petroleo-tinta">
                      <Link to={`/negociacoes/${row.id}`} className="text-petroleo-tinta no-underline">
                        {row.numero}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px]">{row.cliente?.nome ?? row.clienteId}</td>
                    <td className="tabnum px-5 py-3.5 text-[13.5px] text-muted-foreground">
                      {formatarData(row.dataNegociacao)}
                    </td>
                    <td className="tabnum px-5 py-3.5 text-right font-mono text-[13.5px] font-semibold">
                      {formatarMoeda(row.valorBruto)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
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

interface KpiCardProps {
  label: string;
  corner: 'neutral' | 'critical' | 'interactive' | 'inverted';
  isLoading: boolean;
  value?: string;
  valueClassName?: string;
  footnote?: string;
  dark?: boolean;
}

function KpiCard({ label, corner, isLoading, value, valueClassName, footnote, dark }: KpiCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-panel border p-5 ${
        dark ? 'border-petroleo-tinta bg-petroleo-tinta' : 'border-border bg-surface'
      }`}
    >
      <LedgerCorner tone={corner} />
      <div className={`text-[12.5px] font-medium ${dark ? 'text-[#9FD1CE]' : 'text-muted'}`}>{label}</div>
      {isLoading ? (
        <div className="mt-2 h-7 w-32 animate-pulse rounded bg-border-subtle" />
      ) : (
        <div
          className={`tabnum mt-2 font-mono text-2xl font-semibold ${
            valueClassName ?? (dark ? 'text-white' : 'text-petroleo-tinta')
          }`}
        >
          {value}
        </div>
      )}
      <div className={`mt-1.5 text-xs ${dark ? 'text-[#9FD1CE]' : 'text-muted'}`}>
        {isLoading ? '' : footnote}
      </div>
    </div>
  );
}

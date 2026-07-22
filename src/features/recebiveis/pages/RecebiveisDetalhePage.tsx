import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { StatusBadge, STATUS_RECEBIVEL_TONE } from '../../../components/shared/StatusBadge';
import { formatarData, formatarMoeda } from '../../../lib/format';
import { useCliente } from '../../clientes/hooks/useClienteDetalhe';
import { nomeExibicaoCliente } from '../../../types/cliente';
import { referenciaRecebivel } from '../../../types/recebivel';
import { useRecebivel, useUploadDocumentoRecebivel, type LadoDocumento } from '../hooks/useRecebivelDetalhe';

/**
 * Tradução de design/RecebiveisDetalhe.dc.html. `GET /recebiveis/:id` não
 * inclui a relação `cliente` (recebiveis.service.ts findOne não tem
 * `include`) — buscamos o cliente à parte. "Histórico" não tem endpoint de
 * auditoria no backend; a timeline é derivada de campos reais
 * (createdAt/updatedAt/dataVencimento/status/documentos anexados).
 */
export function RecebiveisDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data: recebivel, isLoading, isError } = useRecebivel(id!);
  const cliente = useCliente(recebivel?.clienteId ?? '');

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse px-10 py-8">
          <div className="mb-6 h-6 w-64 rounded bg-border-subtle" />
          <div className="mb-7 grid grid-cols-3 gap-[18px]">
            <div className="h-24 rounded-panel bg-border-subtle" />
            <div className="h-24 rounded-panel bg-border-subtle" />
            <div className="h-24 rounded-panel bg-border-subtle" />
          </div>
          <div className="h-64 rounded-panel bg-border-subtle" />
        </div>
      </AppShell>
    );
  }

  if (isError || !recebivel) {
    return (
      <AppShell>
        <div className="p-10 text-sm text-muted">
          Não foi possível carregar este recebível. Verifique o link ou tente novamente.
        </div>
      </AppShell>
    );
  }

  const statusInfo = STATUS_RECEBIVEL_TONE[recebivel.status] ?? { label: recebivel.status, tone: 'neutral' as const };
  const valorPago = recebivel.valorNominal - recebivel.valorAberto;
  const titulo = `${recebivel.tipo === 'DUPLICATA' ? 'Duplicata' : 'Cheque'} ${referenciaRecebivel(recebivel)}`;
  const nomeCliente = cliente.data ? nomeExibicaoCliente(cliente.data) : recebivel.clienteId;

  const historico = montarHistorico(recebivel);

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">
            <Link to="/recebiveis" className="text-petroleo-interativo no-underline hover:text-petroleo-tinta">
              Recebíveis
            </Link>{' '}
            / {referenciaRecebivel(recebivel)}
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold">{titulo}</h1>
            <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
          </div>
          <div className="mt-1 text-[13px] text-muted">
            {nomeCliente} · cadastrado em {formatarData(recebivel.createdAt)}
          </div>
        </div>
        <Link
          to="/negociacoes/novo"
          className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline"
        >
          Incluir em negociação
        </Link>
      </div>

      <div className="px-10 py-8">
        <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[18px]">
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-[12.5px] text-muted">Valor de face</div>
            <div className="tabnum mt-1.5 font-mono text-xl font-semibold text-petroleo-tinta">
              {formatarMoeda(recebivel.valorNominal)}
            </div>
          </div>
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-[12.5px] text-muted">Vencimento</div>
            <div className="tabnum mt-1.5 font-mono text-xl font-semibold">{formatarData(recebivel.dataVencimento)}</div>
          </div>
          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="text-[12.5px] text-muted">Valor pago</div>
            <div className="tabnum mt-1.5 font-mono text-xl font-semibold">{formatarMoeda(valorPago)}</div>
          </div>
        </div>

        <div className="grid grid-cols-[1.3fr_1fr] gap-[18px]">
          <div className="flex flex-col gap-[18px]">
            <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[22px]">
              <LedgerCorner tone="neutral" />
              <div className="mb-3.5 text-[13px] font-semibold">
                {recebivel.tipo === 'DUPLICATA' ? 'Dados da duplicata' : 'Dados do cheque'}
              </div>
              <div className="grid grid-cols-2 gap-x-[18px] gap-y-3.5">
                {recebivel.tipo === 'DUPLICATA' ? (
                  <>
                    <Field label="Nota fiscal" value={recebivel.numeroNotaFiscal} mono />
                    <Field label="Aceite" value={recebivel.aceite ? 'Sim' : 'Não'} />
                    <div className="col-span-2">
                      <Field label="Cliente (cedente)" value={nomeCliente} />
                    </div>
                    <div className="col-span-2">
                      <Field label="Sacado" value={recebivel.sacado} />
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Banco" value={recebivel.banco} />
                    <Field label="Agência" value={recebivel.agencia} mono />
                    <Field label="Conta" value={recebivel.conta} mono />
                    <Field label="Número do cheque" value={recebivel.numeroCheque} mono />
                    <Field label="Bom para" value={recebivel.dataBomPara ? formatarData(recebivel.dataBomPara) : undefined} mono />
                    <Field label="Emitente" value={recebivel.emitente} />
                    <div className="col-span-2">
                      <Field label="Cliente (cedente)" value={nomeCliente} />
                    </div>
                  </>
                )}
                <Field label="Data de emissão" value={formatarData(recebivel.dataEmissao)} mono />
              </div>
            </div>

            <div className="overflow-hidden rounded-panel border border-border bg-surface">
              <div className="border-b border-border px-5 py-[18px] text-[15px] font-semibold">Histórico</div>
              <div className="flex flex-col">
                {historico.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-border-subtle px-5 py-3.5 last:border-b-0">
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-petroleo-interativo" />
                    <div>
                      <div className="text-[13px] font-medium">{h.label}</div>
                      <div className="tabnum mt-0.5 text-[11.5px] text-muted">{h.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <FotosDocumento recebivelId={recebivel.id} frenteUrl={recebivel.documentoFrenteUrl} versoUrl={recebivel.documentoVersoUrl} />
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11.5px] text-muted">{label}</div>
      <div className={`mt-0.5 text-[13.5px] ${mono ? 'tabnum font-mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

function montarHistorico(recebivel: {
  createdAt: string;
  updatedAt: string;
  dataVencimento: string;
  status: string;
  documentoFrenteUrl?: string | null;
  documentoVersoUrl?: string | null;
}): { label: string; date: string }[] {
  const eventos: { label: string; date: string }[] = [
    { label: 'Recebível cadastrado no sistema', date: formatarDataHora(recebivel.createdAt) },
  ];

  if (recebivel.documentoFrenteUrl || recebivel.documentoVersoUrl) {
    eventos.push({ label: 'Fotos do documento anexadas', date: formatarDataHora(recebivel.updatedAt) });
  }

  if (recebivel.status === 'VENCIDO') {
    eventos.push({ label: 'Vencimento atingido sem pagamento', date: formatarData(recebivel.dataVencimento) });
  } else if (recebivel.status === 'NEGOCIADO') {
    eventos.push({ label: 'Recebível incluído em negociação', date: formatarDataHora(recebivel.updatedAt) });
  } else if (recebivel.status === 'INADIMPLENTE') {
    eventos.push({ label: 'Recebível marcado como inadimplente', date: formatarDataHora(recebivel.updatedAt) });
  } else if (recebivel.status === 'QUITADO') {
    eventos.push({ label: 'Recebível quitado', date: formatarDataHora(recebivel.updatedAt) });
  }

  return eventos;
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function FotosDocumento({
  recebivelId,
  frenteUrl,
  versoUrl,
}: {
  recebivelId: string;
  frenteUrl?: string | null;
  versoUrl?: string | null;
}) {
  return (
    <div className="rounded-panel border border-border bg-surface p-[22px]">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Fotos do documento</div>
      <div className="mb-3 text-[12.5px] text-muted">Frente e verso, para conferência e eventual disputa.</div>
      <div className="flex flex-col gap-4">
        <SlotFoto recebivelId={recebivelId} lado="FRENTE" url={frenteUrl} label="Frente do documento" />
        <SlotFoto recebivelId={recebivelId} lado="VERSO" url={versoUrl} label="Verso do documento" />
      </div>
    </div>
  );
}

function SlotFoto({
  recebivelId,
  lado,
  url,
  label,
}: {
  recebivelId: string;
  lado: LadoDocumento;
  url?: string | null;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState('');
  const upload = useUploadDocumentoRecebivel(recebivelId);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErro('');
    try {
      await upload.mutateAsync({ lado, arquivo });
    } catch {
      setErro('Não foi possível enviar a imagem. Use JPEG ou PNG de até 10MB.');
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[8px] border border-dashed border-border bg-surface-sunken text-center"
      >
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="px-4 text-[12.5px] text-muted">
            {upload.isPending ? 'Enviando…' : label}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onFileSelected} />
      {erro && <p className="mt-1.5 text-xs text-vermelho-critico">{erro}</p>}
    </div>
  );
}

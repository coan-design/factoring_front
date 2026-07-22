import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { StatusBadge, STATUS_CLIENTE_TONE, STATUS_RECEBIVEL_TONE } from '../../../components/shared/StatusBadge';
import { formatarData, formatarMoeda } from '../../../lib/format';
import type { StatusCliente } from '../../../types/cliente';
import { nomeExibicaoCliente } from '../../../types/cliente';
import { contraparteRecebivel, referenciaRecebivel } from '../../../types/recebivel';
import { useAlternarStatusCliente } from '../hooks/useClientes';
import {
  useCliente,
  useEmprestimosAtivosResumo,
  useNegociacoesResumo,
  useRecebiveisDoCliente,
} from '../hooks/useClienteDetalhe';

type Aba = 'recebiveis' | 'emprestimos' | 'negociacoes';

/** Tradução 1:1 de design/ClientesDetalhe.dc.html. */
export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [aba, setAba] = useState<Aba>('recebiveis');
  const { data: cliente, isLoading, isError } = useCliente(id!);
  const alternarStatus = useAlternarStatusCliente();

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse px-10 py-8">
          <div className="mb-6 h-6 w-64 rounded bg-border-subtle" />
          <div className="mb-7 grid grid-cols-2 gap-[18px]">
            <div className="h-40 rounded-panel bg-border-subtle" />
            <div className="h-40 rounded-panel bg-border-subtle" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError || !cliente) {
    return (
      <AppShell>
        <div className="p-10 text-sm text-muted">
          Não foi possível carregar este cliente. Verifique o link ou tente novamente.
        </div>
      </AppShell>
    );
  }

  const statusInfo = STATUS_CLIENTE_TONE[cliente.status] ?? { label: cliente.status, tone: 'neutral' as const };
  const proximoStatus: StatusCliente = cliente.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
  const nome = nomeExibicaoCliente(cliente);

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">
            <Link to="/clientes" className="text-petroleo-interativo no-underline hover:text-petroleo-tinta">
              Clientes
            </Link>{' '}
            / {nome}
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold">{nome}</h1>
            <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={alternarStatus.isPending}
            onClick={() => alternarStatus.mutate({ id: cliente.id, status: proximoStatus })}
            className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium disabled:opacity-60"
          >
            {cliente.status === 'ATIVO' ? 'Inativar cliente' : 'Ativar cliente'}
          </button>
          <Link
            to={`/clientes/${cliente.id}/editar`}
            className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline"
          >
            Editar
          </Link>
        </div>
      </div>

      <div className="px-10 py-8">
        <div className="mb-7 grid grid-cols-2 gap-[18px]">
          <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[22px]">
            <LedgerCorner tone="neutral" />
            <div className="mb-3.5 text-[13px] font-semibold">Dados cadastrais</div>
            <div className="grid grid-cols-2 gap-x-[18px] gap-y-3.5">
              <Field label="Nome" value={cliente.nome} />
              <Field label={cliente.tipoCliente === 'PESSOA_JURIDICA' ? 'CNPJ' : 'CPF'} value={cliente.cpfCnpj} mono />
              <Field label="Telefone" value={cliente.telefone} />
              <Field label="E-mail" value={cliente.email} />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[22px]">
            <LedgerCorner tone="neutral" />
            <div className="mb-3.5 text-[13px] font-semibold">Endereço</div>
            {cliente.endereco ? (
              <div className="grid grid-cols-2 gap-x-[18px] gap-y-3.5">
                <div className="col-span-2">
                  <Field label="Logradouro" value={`${cliente.endereco.logradouro}, ${cliente.endereco.numero}`} />
                </div>
                <Field label="Bairro" value={cliente.endereco.bairro} />
                <Field label="Cidade / UF" value={`${cliente.endereco.cidade} / ${cliente.endereco.estado}`} />
                <Field label="CEP" value={cliente.endereco.cep} mono />
              </div>
            ) : (
              <div className="text-[13px] text-muted">Endereço não cadastrado.</div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-panel border border-border bg-surface">
          <div className="flex border-b border-border px-5">
            <Tab active={aba === 'recebiveis'} onClick={() => setAba('recebiveis')}>
              Recebíveis
            </Tab>
            <Tab active={aba === 'emprestimos'} onClick={() => setAba('emprestimos')}>
              Empréstimos
            </Tab>
            <Tab active={aba === 'negociacoes'} onClick={() => setAba('negociacoes')}>
              Negociações
            </Tab>
          </div>

          {aba === 'recebiveis' && <RecebiveisTab clienteId={cliente.id} />}
          {aba === 'emprestimos' && <EmprestimosTab clienteId={cliente.id} />}
          {aba === 'negociacoes' && <NegociacoesTab clienteId={cliente.id} />}
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

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      className={`mr-[26px] cursor-pointer py-3.5 text-[13.5px] font-semibold ${
        active ? 'border-b-2 border-petroleo-interativo text-petroleo-tinta' : 'border-b-2 border-transparent text-muted'
      }`}
    >
      {children}
    </div>
  );
}

function RecebiveisTab({ clienteId }: { clienteId: string }) {
  const { data, isLoading } = useRecebiveisDoCliente(clienteId);

  if (isLoading) {
    return <div className="px-5 py-10 text-center text-[13.5px] text-muted">Carregando…</div>;
  }
  if (!data || data.data.length === 0) {
    return <div className="px-5 py-10 text-center text-[13.5px] text-muted">Nenhum recebível cadastrado.</div>;
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-surface-sunken">
          <Th align="left">Tipo</Th>
          <Th align="left">Nº / Sacado</Th>
          <Th align="left">Vencimento</Th>
          <Th align="right">Valor</Th>
          <Th align="left">Status</Th>
        </tr>
      </thead>
      <tbody>
        {data.data.map((r) => {
          const statusInfo = STATUS_RECEBIVEL_TONE[r.status] ?? { label: r.status, tone: 'neutral' as const };
          return (
            <tr key={r.id} className="border-b border-border-subtle hover:bg-surface-sunken">
              <td className="px-5 py-3.5 text-[13.5px]">{r.tipo === 'DUPLICATA' ? 'Duplicata' : 'Cheque'}</td>
              <td className="px-5 py-3.5 text-[13.5px]">
                {referenciaRecebivel(r)} · {contraparteRecebivel(r)}
              </td>
              <td className="tabnum px-5 py-3.5 text-[13.5px] text-muted-foreground">
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
  );
}

function EmprestimosTab({ clienteId }: { clienteId: string }) {
  const resumo = useEmprestimosAtivosResumo(clienteId);
  if (resumo.isLoading) {
    return <div className="px-5 py-10 text-center text-[13.5px] text-muted">Carregando…</div>;
  }
  if (resumo.quantidade === 0) {
    return <div className="px-5 py-10 text-center text-[13.5px] text-muted">Nenhum empréstimo ativo.</div>;
  }
  return (
    <div className="px-5 py-10 text-center text-[13.5px] text-muted">
      {resumo.quantidade} {resumo.quantidade === 1 ? 'empréstimo ativo' : 'empréstimos ativos'} —{' '}
      {formatarMoeda(resumo.saldoDevedorTotal)} em saldo devedor.
    </div>
  );
}

function NegociacoesTab({ clienteId }: { clienteId: string }) {
  const resumo = useNegociacoesResumo(clienteId);
  if (resumo.isLoading) {
    return <div className="px-5 py-10 text-center text-[13.5px] text-muted">Carregando…</div>;
  }
  return (
    <div className="px-5 py-10 text-center text-[13.5px] text-muted">
      {resumo.finalizadas} {resumo.finalizadas === 1 ? 'negociação concluída' : 'negociações concluídas'},{' '}
      {resumo.emAndamento} em andamento.
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align: 'left' | 'right' }) {
  return (
    <th
      className={`border-b border-border px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

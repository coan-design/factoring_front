import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { Pagination } from '../../../components/shared/Pagination';
import { StatusBadge, STATUS_CLIENTE_TONE } from '../../../components/shared/StatusBadge';
import { Th } from '../../../components/shared/Th';
import type { StatusCliente, TipoCliente } from '../../../types/cliente';
import { nomeExibicaoCliente } from '../../../types/cliente';
import { useAlternarStatusCliente, useClientes } from '../hooks/useClientes';

/** Tradução 1:1 de design/ClientesListagem.dc.html. */
export function ClientesListPage() {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<StatusCliente | ''>('');
  const [tipoCliente, setTipoCliente] = useState<TipoCliente | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useClientes({
    page,
    busca: busca || undefined,
    status: status || undefined,
    tipoCliente: tipoCliente || undefined,
  });
  const alternarStatus = useAlternarStatusCliente();

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">Início / Clientes</div>
          <h1 className="mt-0.5 font-display text-2xl font-semibold">Clientes</h1>
        </div>
        <Link
          to="/clientes/novo"
          className="flex items-center gap-1.5 rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo cliente
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
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, CNPJ ou CPF"
              className="w-full rounded-control border border-border bg-white py-2.5 pl-9 pr-3 text-[13.5px]"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusCliente | '');
              setPage(1);
            }}
            className="rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px] text-grafite-texto"
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select
            value={tipoCliente}
            onChange={(e) => {
              setTipoCliente(e.target.value as TipoCliente | '');
              setPage(1);
            }}
            className="rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px] text-grafite-texto"
          >
            <option value="">Todos os tipos</option>
            <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
            <option value="PESSOA_FISICA">Pessoa Física</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-panel border border-border bg-surface">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-sunken">
                <Th align="left">Cliente</Th>
                <Th align="left">Tipo</Th>
                <Th align="left">CNPJ/CPF</Th>
                <Th align="left">Status</Th>
                <Th align="right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-[13px] text-muted">
                    Carregando…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-[13px] text-muted">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {data?.data.map((cliente) => {
                const statusInfo = STATUS_CLIENTE_TONE[cliente.status] ?? {
                  label: cliente.status,
                  tone: 'neutral' as const,
                };
                const proximoStatus: StatusCliente = cliente.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
                return (
                  <tr key={cliente.id} className="border-b border-border-subtle hover:bg-surface-sunken">
                    <td className="px-5 py-3.5 text-[13.5px] font-medium">
                      <Link to={`/clientes/${cliente.id}`} className="text-grafite-texto no-underline">
                        {nomeExibicaoCliente(cliente)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] text-muted-foreground">
                      {cliente.tipoCliente === 'PESSOA_JURIDICA' ? 'Jurídica' : 'Física'}
                    </td>
                    <td className="tabnum px-5 py-3.5 font-mono text-[13.5px] text-muted-foreground">
                      {cliente.cpfCnpj}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          disabled={alternarStatus.isPending}
                          onClick={() => alternarStatus.mutate({ id: cliente.id, status: proximoStatus })}
                          className="rounded-control border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-grafite-texto disabled:opacity-60"
                        >
                          {cliente.status === 'ATIVO' ? 'Inativar' : 'Ativar'}
                        </button>
                        <Link
                          to={`/clientes/${cliente.id}`}
                          className="rounded-control bg-[#EFF4F4] px-3 py-1.5 text-[12.5px] font-medium text-petroleo-interativo no-underline"
                        >
                          Ver detalhe
                        </Link>
                      </div>
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
              itemLabel="clientes"
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

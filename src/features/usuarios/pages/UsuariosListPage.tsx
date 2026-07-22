import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { Pagination } from '../../../components/shared/Pagination';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { Th } from '../../../components/shared/Th';
import { iniciais, PERFIL_CORES, type PerfilUsuario, type Usuario } from '../../../types/usuario';
import { useAlternarAtivoUsuario, useUsuarios } from '../hooks/useUsuarios';

type Aba = 'ativos' | 'inativos';
const PAGE_SIZE = 8;

/**
 * Tradução de design/UsuariosListagem.dc.html. GET /usuarios não tem filtro
 * de `ativo`, `busca` nem `perfil` (só page/pageSize) — abas, busca e filtro
 * de perfil são resolvidos no cliente sobre a lista completa. "Último
 * acesso" do mockup não existe no backend (Usuario não rastreia login) —
 * omitido; "Inativado em" usa `updatedAt` como aproximação honesta (mesmo
 * raciocínio do Histórico de RecebiveisDetalhe).
 */
export function UsuariosListPage() {
  const [aba, setAba] = useState<Aba>('ativos');
  const [busca, setBusca] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario | ''>('');
  const [page, setPage] = useState(1);

  const { data: usuarios, isLoading } = useUsuarios();
  const alternarAtivo = useAlternarAtivoUsuario();

  const filtrados = useMemo(() => {
    return (usuarios ?? [])
      .filter((u) => (aba === 'ativos' ? u.ativo : !u.ativo))
      .filter((u) => !perfil || u.perfil === perfil)
      .filter((u) => {
        if (!busca) return true;
        const alvo = busca.toLowerCase();
        return u.nome.toLowerCase().includes(alvo) || u.email.toLowerCase().includes(alvo);
      });
  }, [usuarios, aba, perfil, busca]);

  const pagina = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function mudarAba(novaAba: Aba) {
    setAba(novaAba);
    setPage(1);
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
        <div>
          <div className="text-xs text-muted">Início / Usuários</div>
          <h1 className="mt-0.5 font-display text-2xl font-semibold">Usuários</h1>
        </div>
        <Link
          to="/usuarios/novo"
          className="flex items-center gap-1.5 rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo usuário
        </Link>
      </div>

      <div className="px-10 py-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="inline-flex rounded-[7px] border border-border bg-white p-[3px]">
            <button
              type="button"
              onClick={() => mudarAba('ativos')}
              className={`rounded-[5px] px-4 py-[7px] text-[13px] font-semibold ${
                aba === 'ativos' ? 'bg-[#123B3D] text-white' : 'text-muted-foreground'
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => mudarAba('inativos')}
              className={`rounded-[5px] px-4 py-[7px] text-[13px] font-semibold ${
                aba === 'inativos' ? 'bg-[#123B3D] text-white' : 'text-muted-foreground'
              }`}
            >
              Inativos
            </button>
          </div>
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
              placeholder="Buscar por nome ou e-mail"
              className="w-full rounded-control border border-border bg-white py-2.5 pl-9 pr-3 text-[13.5px]"
            />
          </div>
          <select
            value={perfil}
            onChange={(e) => {
              setPerfil(e.target.value as PerfilUsuario | '');
              setPage(1);
            }}
            className="rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px] text-grafite-texto"
          >
            <option value="">Todos os perfis</option>
            <option value="ADMIN">ADMIN</option>
            <option value="OPERADOR">OPERADOR</option>
            <option value="ANALISTA">ANALISTA</option>
          </select>
        </div>

        {isLoading && <div className="px-5 py-6 text-center text-[13px] text-muted">Carregando…</div>}

        {!isLoading && filtrados.length === 0 && (
          <div className="flex flex-col items-center rounded-panel border border-border bg-surface px-5 py-16 text-center">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EDEFEE]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B9493" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3" />
                <path d="M3.5 19c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
                <path d="M4 4l16 16" />
              </svg>
            </div>
            <div className="text-[14.5px] font-semibold">
              {aba === 'ativos' ? 'Nenhum usuário ativo' : 'Nenhum usuário inativo'}
            </div>
            <div className="mt-1.5 max-w-[320px] text-[13px] text-muted">
              {aba === 'ativos'
                ? 'Nenhum usuário ativo encontrado com esses filtros.'
                : 'Todos os usuários cadastrados estão ativos no momento.'}
            </div>
          </div>
        )}

        {!isLoading && filtrados.length > 0 && (
          <div className="overflow-hidden rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[780px] border-collapse">
              <thead>
                <tr className="bg-surface-sunken">
                  <Th>Usuário</Th>
                  <Th>E-mail</Th>
                  <Th>Perfil</Th>
                  {aba === 'inativos' && <Th>Inativado em</Th>}
                  <Th>Status</Th>
                  <Th align="right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {pagina.map((usuario) => (
                  <UsuarioRow
                    key={usuario.id}
                    usuario={usuario}
                    aba={aba}
                    onAlternarAtivo={() => alternarAtivo.mutate({ id: usuario.id, ativo: !usuario.ativo })}
                    alternando={alternarAtivo.isPending}
                  />
                ))}
              </tbody>
            </table>

            <Pagination page={page} pageSize={PAGE_SIZE} total={filtrados.length} itemLabel="usuários" onPageChange={setPage} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function UsuarioRow({
  usuario,
  aba,
  onAlternarAtivo,
  alternando,
}: {
  usuario: Usuario;
  aba: Aba;
  onAlternarAtivo: () => void;
  alternando: boolean;
}) {
  const cores = PERFIL_CORES[usuario.perfil];
  return (
    <tr className="border-b border-border-subtle hover:bg-surface-sunken">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF4F4] text-[11.5px] font-semibold text-petroleo-interativo">
            {iniciais(usuario.nome)}
          </div>
          <div className="text-[13.5px] font-medium">{usuario.nome}</div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{usuario.email}</td>
      <td className="px-5 py-3.5">
        <span
          className="inline-flex rounded-[5px] px-[9px] py-[3px] text-[11.5px] font-bold tracking-wide"
          style={{ background: cores.bg, color: cores.color }}
        >
          {usuario.perfil}
        </span>
      </td>
      {aba === 'inativos' && (
        <td className="tabnum px-5 py-3.5 text-[13px] text-muted-foreground">
          {new Date(usuario.updatedAt).toLocaleDateString('pt-BR')}
        </td>
      )}
      <td className="px-5 py-3.5">
        <StatusBadge label={usuario.ativo ? 'Ativo' : 'Inativo'} tone={usuario.ativo ? 'success' : 'neutral'} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="inline-flex gap-1.5">
          <Link
            to={`/usuarios/${usuario.id}/editar`}
            className="rounded-control bg-[#EFF4F4] px-3 py-1.5 text-[12.5px] font-medium text-petroleo-interativo no-underline"
          >
            Editar
          </Link>
          <button
            type="button"
            disabled={alternando}
            onClick={onAlternarAtivo}
            className="rounded-control border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-grafite-texto disabled:opacity-60"
          >
            {usuario.ativo ? 'Inativar' : 'Reativar'}
          </button>
        </div>
      </td>
    </tr>
  );
}

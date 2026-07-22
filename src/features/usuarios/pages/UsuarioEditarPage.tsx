import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { mapApiErrorsToForm } from '../../../lib/api-errors';
import { iniciais, PERFIS, type PerfilUsuario } from '../../../types/usuario';
import { useAlternarAtivoUsuario, useAtualizarUsuario, useRedefinirSenhaUsuario, useUsuario } from '../hooks/useUsuarios';

interface DadosFormValues {
  nome: string;
  email: string;
}

interface SenhaFormValues {
  novaSenha: string;
  confirmarSenha: string;
}

/** Tradução de design/UsuariosEditar.dc.html. "Último acesso" do mockup não existe no backend — omitido. */
export function UsuarioEditarPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: usuario, isLoading } = useUsuario(id!);
  const [perfil, setPerfil] = useState<PerfilUsuario>('OPERADOR');
  const [formError, setFormError] = useState('');
  const atualizarUsuario = useAtualizarUsuario(id!);
  const alternarAtivo = useAlternarAtivoUsuario();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DadosFormValues>();

  useEffect(() => {
    if (usuario) {
      setPerfil(usuario.perfil);
      reset({ nome: usuario.nome, email: usuario.email });
    }
  }, [usuario, reset]);

  async function onSubmit(values: DadosFormValues) {
    setFormError('');
    try {
      await atualizarUsuario.mutateAsync({ nome: values.nome, email: values.email, perfil });
    } catch (error) {
      setFormError(mapApiErrorsToForm(error, setError));
    }
  }

  if (isLoading || !usuario) {
    return (
      <AppShell>
        <div className="animate-pulse px-10 py-8">
          <div className="mb-6 h-6 w-64 rounded bg-border-subtle" />
          <div className="h-96 rounded-panel bg-border-subtle" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
          <div>
            <div className="text-xs text-muted">Início / Usuários / {usuario.nome}</div>
            <h1 className="mt-0.5 font-display text-2xl font-semibold">Editar usuário</h1>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/usuarios')}
              className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={atualizarUsuario.isPending}
              className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {atualizarUsuario.isPending ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </div>

        <div className="max-w-[640px] px-10 py-8">
          <div className="relative mb-5 overflow-hidden rounded-panel border border-border bg-surface p-[26px]">
            <LedgerCorner tone="neutral" />

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF4F4] text-[17px] font-semibold text-petroleo-interativo">
                {iniciais(usuario.nome)}
              </div>
              <div>
                <div className="text-base font-semibold">{usuario.nome}</div>
                <div className="mt-0.5 text-[12.5px] text-muted">
                  {usuario.ativo ? 'Ativo' : 'Inativo'} · cadastrado em {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Dados do usuário</div>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="nome" className="text-[12.5px] font-medium text-muted-foreground">
                  Nome completo
                </label>
                <input
                  id="nome"
                  className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
                  {...register('nome', { required: 'Nome é obrigatório.' })}
                />
                {errors.nome && <p className="mt-1 text-xs text-vermelho-critico">{errors.nome.message}</p>}
              </div>
              <div className="col-span-2">
                <label htmlFor="email" className="text-[12.5px] font-medium text-muted-foreground">
                  E-mail corporativo
                </label>
                <input
                  id="email"
                  className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
                  {...register('email', { required: 'Informe um e-mail corporativo válido.' })}
                />
                {errors.email && <p className="mt-1 text-xs text-vermelho-critico">{errors.email.message}</p>}
              </div>
            </div>

            <div className="mb-6 h-px bg-border-subtle" />

            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Perfil de acesso (RBAC)</div>
            <div className="flex flex-col gap-2.5">
              {PERFIS.map((r) => (
                <div
                  key={r.key}
                  onClick={() => setPerfil(r.key)}
                  className="flex cursor-pointer items-start gap-3 rounded-[8px] border px-4 py-3.5"
                  style={{ borderColor: perfil === r.key ? '#1F6F72' : '#E2E6E5', background: perfil === r.key ? '#F6FAFA' : 'white' }}
                >
                  <div
                    className="mt-px flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px]"
                    style={{ borderColor: perfil === r.key ? '#1F6F72' : '#C7CDCC' }}
                  >
                    {perfil === r.key && <div className="h-[9px] w-[9px] rounded-full bg-petroleo-interativo" />}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold">{r.label}</div>
                    <div className="mt-0.5 text-xs text-muted">{r.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {formError && <p className="mt-5 text-xs text-vermelho-critico">{formError}</p>}
          </div>

          <RedefinirSenhaPanel usuarioId={usuario.id} />

          <div className="mt-4 flex items-center justify-between rounded-panel border border-[#F0DCB8] bg-surface p-[22px]">
            <div>
              <div className="text-[13.5px] font-semibold text-ambar-atencao">
                {usuario.ativo ? 'Inativar usuário' : 'Reativar usuário'}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {usuario.ativo ? 'O acesso ao sistema é bloqueado imediatamente.' : 'O usuário volta a ter acesso ao sistema.'}
              </div>
            </div>
            <button
              type="button"
              disabled={alternarAtivo.isPending}
              onClick={() => alternarAtivo.mutate({ id: usuario.id, ativo: !usuario.ativo })}
              className="rounded-control border border-[#F0DCB8] bg-[#FBF0DF] px-3.5 py-2 text-[13px] font-semibold text-ambar-atencao disabled:opacity-60"
            >
              {usuario.ativo ? 'Inativar' : 'Reativar'}
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function RedefinirSenhaPanel({ usuarioId }: { usuarioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const redefinirSenha = useRedefinirSenhaUsuario(usuarioId);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SenhaFormValues>();

  async function onSubmit(values: SenhaFormValues) {
    setSalvo(false);
    await redefinirSenha.mutateAsync(values.novaSenha);
    setSalvo(true);
    reset();
  }

  return (
    <div className="rounded-panel border border-border bg-surface p-[22px]">
      <div className={`flex items-center justify-between ${aberto ? 'mb-4' : ''}`}>
        <div>
          <div className="text-[13.5px] font-semibold">Redefinir senha</div>
          <div className="mt-0.5 text-xs text-muted">Defina uma nova senha diretamente para este usuário.</div>
        </div>
        {!aberto && (
          <button
            type="button"
            onClick={() => {
              setAberto(true);
              setSalvo(false);
            }}
            className="rounded-control border border-border bg-white px-3.5 py-2 text-[13px] font-medium"
          >
            Definir nova senha
          </button>
        )}
      </div>

      {aberto && (
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="novaSenha" className="mb-1.5 block text-xs font-medium text-grafite-texto">
              Nova senha
            </label>
            <input
              id="novaSenha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
              {...register('novaSenha', { required: true, minLength: { value: 6, message: 'A senha deve ter ao menos 6 caracteres.' } })}
            />
            {errors.novaSenha && <p className="mt-1 text-xs text-vermelho-critico">{errors.novaSenha.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmarSenha" className="mb-1.5 block text-xs font-medium text-grafite-texto">
              Confirmar nova senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              placeholder="Repita a nova senha"
              className="w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
              {...register('confirmarSenha', {
                required: true,
                validate: (value) => value === watch('novaSenha') || 'As senhas não coincidem.',
              })}
            />
            {errors.confirmarSenha && <p className="mt-1 text-xs text-vermelho-critico">{errors.confirmarSenha.message}</p>}
          </div>
          {salvo && <div className="text-[12.5px] font-medium text-petroleo-interativo">Senha atualizada com sucesso.</div>}
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={redefinirSenha.isPending}
              onClick={handleSubmit(onSubmit)}
              className="rounded-control bg-petroleo-interativo px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {redefinirSenha.isPending ? 'Salvando…' : 'Salvar nova senha'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                reset();
              }}
              className="rounded-control border border-border bg-white px-3.5 py-2 text-[13px] font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import type { ApiErrorBody } from '../../../types/common';
import { iniciais, PERFIL_CORES } from '../../../types/usuario';
import { useAlterarMinhaSenha, useAtualizarMeuPerfil, useMeuPerfil } from '../hooks/useMeuPerfil';

interface DadosFormValues {
  nome: string;
}

interface SenhaFormValues {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

/** Tradução de design/MeuPerfil.dc.html. E-mail e perfil não são editáveis pelo próprio usuário (UpdateMeDto só aceita `nome`). */
export function MeuPerfilPage() {
  const { data: usuario, isLoading } = useMeuPerfil();

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

  const cores = PERFIL_CORES[usuario.perfil];

  return (
    <AppShell>
      <div className="border-b border-border bg-surface px-10 py-6">
        <div className="text-xs text-muted">Início / Meu perfil</div>
        <h1 className="mt-0.5 font-display text-2xl font-semibold">Meu perfil</h1>
      </div>

      <div className="max-w-[640px] px-10 py-8">
        <div className="relative mb-5 overflow-hidden rounded-panel border border-border bg-surface p-[26px]">
          <LedgerCorner tone="neutral" />
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-petroleo-interativo text-xl font-semibold text-white">
              {iniciais(usuario.nome)}
            </div>
            <div>
              <div className="text-[17px] font-semibold">{usuario.nome}</div>
              <span
                className="mt-1 inline-flex rounded-[5px] px-[9px] py-[3px] text-[11.5px] font-bold tracking-wide"
                style={{ background: cores.bg, color: cores.color }}
              >
                {usuario.perfil}
              </span>
            </div>
          </div>

          <DadosPessoaisForm nomeAtual={usuario.nome} email={usuario.email} />
        </div>

        <AlterarSenhaForm />
      </div>
    </AppShell>
  );
}

function DadosPessoaisForm({ nomeAtual, email }: { nomeAtual: string; email: string }) {
  const [salvo, setSalvo] = useState(false);
  const atualizarPerfil = useAtualizarMeuPerfil();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DadosFormValues>({ defaultValues: { nome: nomeAtual } });

  async function onSubmit(values: DadosFormValues) {
    setSalvo(false);
    await atualizarPerfil.mutateAsync(values.nome);
    setSalvo(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-4">
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
            value={email}
            disabled
            className="mt-1.5 w-full cursor-not-allowed rounded-control border border-border bg-[#F6F7F6] px-3 py-2.5 text-[13.5px] text-muted"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        {salvo && <span className="text-[12.5px] font-medium text-petroleo-interativo">Alterações salvas.</span>}
        <button
          type="submit"
          disabled={atualizarPerfil.isPending}
          className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
        >
          {atualizarPerfil.isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}

function AlterarSenhaForm() {
  const [salvo, setSalvo] = useState(false);
  const alterarSenha = useAlterarMinhaSenha();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<SenhaFormValues>();

  useEffect(() => {
    const subscription = watch(() => setSalvo(false));
    return () => subscription.unsubscribe();
  }, [watch]);

  async function onSubmit(values: SenhaFormValues) {
    setSalvo(false);
    try {
      await alterarSenha.mutateAsync({ senhaAtual: values.senhaAtual, novaSenha: values.novaSenha });
      setSalvo(true);
      reset();
    } catch (error) {
      if (isAxiosError<ApiErrorBody>(error) && error.response?.status === 401) {
        setError('senhaAtual', { type: 'server', message: error.response.data.message ?? 'Senha atual incorreta.' });
      } else {
        setError('senhaAtual', { type: 'server', message: 'Não foi possível alterar a senha. Tente novamente.' });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-panel border border-border bg-surface p-[26px]">
      <div className="mb-1 text-[13px] font-semibold">Alterar senha</div>
      <div className="mb-[18px] text-[12.5px] text-muted">Recomendamos trocar a senha a cada 90 dias.</div>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="senhaAtual" className="text-[12.5px] font-medium text-muted-foreground">
            Senha atual
          </label>
          <input
            id="senhaAtual"
            type="password"
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
            {...register('senhaAtual', { required: 'Informe a senha atual.' })}
          />
          {errors.senhaAtual && <p className="mt-1 text-xs text-vermelho-critico">{errors.senhaAtual.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="novaSenha" className="text-[12.5px] font-medium text-muted-foreground">
              Nova senha
            </label>
            <input
              id="novaSenha"
              type="password"
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
              {...register('novaSenha', { required: 'Informe a nova senha.', minLength: { value: 6, message: 'A senha deve ter ao menos 6 caracteres.' } })}
            />
            {errors.novaSenha && <p className="mt-1 text-xs text-vermelho-critico">{errors.novaSenha.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmarSenha" className="text-[12.5px] font-medium text-muted-foreground">
              Confirmar nova senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
              {...register('confirmarSenha', {
                required: 'Confirme a nova senha.',
                validate: (value) => value === watch('novaSenha') || 'As senhas não coincidem.',
              })}
            />
            {errors.confirmarSenha && <p className="mt-1 text-xs text-vermelho-critico">{errors.confirmarSenha.message}</p>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        {salvo && <span className="text-[12.5px] font-medium text-petroleo-interativo">Senha atualizada.</span>}
        <button
          type="submit"
          disabled={alterarSenha.isPending}
          className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium disabled:opacity-60"
        >
          {alterarSenha.isPending ? 'Atualizando…' : 'Atualizar senha'}
        </button>
      </div>
    </form>
  );
}

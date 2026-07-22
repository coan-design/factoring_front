import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { mapApiErrorsToForm } from '../../../lib/api-errors';
import { PERFIS, type PerfilUsuario } from '../../../types/usuario';
import { useCriarUsuario } from '../hooks/useUsuarios';

interface UsuarioFormValues {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

/**
 * Tradução de design/UsuariosFormulario.dc.html. O mockup não tem campo de
 * senha, mas CreateUsuarioDto exige `senha` (mínimo 6 caracteres) — adicionei
 * "Senha temporária" + confirmação; o usuário pode trocá-la depois em Meu
 * perfil.
 */
export function UsuarioFormPage() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilUsuario>('OPERADOR');
  const [formError, setFormError] = useState('');
  const criarUsuario = useCriarUsuario();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<UsuarioFormValues>();

  async function onSubmit(values: UsuarioFormValues) {
    setFormError('');
    try {
      await criarUsuario.mutateAsync({ nome: values.nome, email: values.email, senha: values.senha, perfil });
      navigate('/usuarios', { replace: true });
    } catch (error) {
      setFormError(mapApiErrorsToForm(error, setError));
    }
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
          <div>
            <div className="text-xs text-muted">Início / Usuários / Novo</div>
            <h1 className="mt-0.5 font-display text-2xl font-semibold">Novo usuário</h1>
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
              disabled={criarUsuario.isPending}
              className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {criarUsuario.isPending ? 'Salvando…' : 'Salvar usuário'}
            </button>
          </div>
        </div>

        <div className="max-w-[640px] px-10 py-8">
          <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[26px]">
            <LedgerCorner tone="neutral" />

            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Dados do usuário</div>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="nome" className="text-[12.5px] font-medium text-muted-foreground">
                  Nome completo
                </label>
                <input
                  id="nome"
                  placeholder="Ex: Diego Martins"
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
                  placeholder="nome@cedrofactoring.com.br"
                  className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
                  {...register('email', { required: 'Informe um e-mail corporativo válido.' })}
                />
                {errors.email && <p className="mt-1 text-xs text-vermelho-critico">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="senha" className="text-[12.5px] font-medium text-muted-foreground">
                  Senha temporária
                </label>
                <input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
                  {...register('senha', { required: 'Informe uma senha.', minLength: { value: 6, message: 'A senha deve ter ao menos 6 caracteres.' } })}
                />
                {errors.senha && <p className="mt-1 text-xs text-vermelho-critico">{errors.senha.message}</p>}
              </div>
              <div>
                <label htmlFor="confirmarSenha" className="text-[12.5px] font-medium text-muted-foreground">
                  Confirmar senha
                </label>
                <input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Repita a senha"
                  className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
                  {...register('confirmarSenha', {
                    required: 'Confirme a senha.',
                    validate: (value) => value === watch('senha') || 'As senhas não coincidem.',
                  })}
                />
                {errors.confirmarSenha && <p className="mt-1 text-xs text-vermelho-critico">{errors.confirmarSenha.message}</p>}
              </div>
              <div className="col-span-2 text-[11.5px] text-muted">O usuário poderá alterá-la depois em Meu perfil.</div>
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
        </div>
      </form>
    </AppShell>
  );
}

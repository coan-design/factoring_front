import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { mapApiErrorsToForm } from '../../../lib/api-errors';
import { useLogin } from '../hooks/useLogin';

interface LoginFormValues {
  email: string;
  senha: string;
}

/** Tradução 1:1 de design/Login.dc.html. */
export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const [formError, setFormError] = useState('');

  async function onSubmit(values: LoginFormValues) {
    setFormError('');
    try {
      await login.mutateAsync(values);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(mapApiErrorsToForm(error, setError));
    }
  }

  return (
    <div className="flex h-screen w-full font-sans text-grafite-texto">
      <div className="relative flex min-w-[340px] flex-1 flex-col justify-between overflow-hidden bg-petroleo-tinta p-12 text-[#E7EEEC]">
        <div
          className="absolute right-0 top-0 h-16 w-16 bg-neutro-base"
          style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
        />
        <div className="flex items-center gap-2.5">
          <div className="relative h-[30px] w-[30px] rounded bg-[#E7EEEC]">
            <div
              className="absolute right-0 top-0 h-2.5 w-2.5 bg-petroleo-tinta"
              style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
            />
          </div>
          <div className="font-display text-[19px] font-semibold tracking-wide">CEDRO</div>
        </div>
        <div className="max-w-[400px]">
          <div className="font-display text-[30px] font-semibold leading-tight">
            Operação de factoring com precisão de ponta a ponta.
          </div>
          <div className="mt-3.5 text-sm leading-relaxed text-[#9FD1CE]">
            Cadastro de clientes, recebíveis e negociações de cessão em um único fluxo, com cada
            número rastreável até sua origem.
          </div>
        </div>
        <div className="text-xs text-[#6FA3A1]">Uso interno · v2.4</div>
      </div>

      <div className="flex min-w-[380px] flex-1 items-center justify-center bg-neutro-base">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[360px]">
          <h1 className="mb-1.5 font-display text-2xl font-semibold">Entrar</h1>
          <div className="mb-7 text-[13.5px] text-muted">Acesse com suas credenciais corporativas.</div>

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="text-[12.5px] font-medium text-muted-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="nome@empresa.com.br"
                className="mt-1.5 w-full rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px]"
                {...register('email', { required: 'Informe o e-mail' })}
              />
              {errors.email && <p className="mt-1 text-xs text-vermelho-critico">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="senha" className="text-[12.5px] font-medium text-muted-foreground">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px]"
                {...register('senha', { required: 'Informe a senha' })}
              />
              {errors.senha && <p className="mt-1 text-xs text-vermelho-critico">{errors.senha.message}</p>}
            </div>
            <div className="flex justify-end">
              <a href="#" className="text-[12.5px] font-medium text-petroleo-interativo no-underline hover:text-petroleo-tinta">
                Esqueci minha senha
              </a>
            </div>
            {formError && <p className="text-xs text-vermelho-critico">{formError}</p>}
            <button
              type="submit"
              disabled={login.isPending}
              className="mt-1 w-full rounded-control bg-petroleo-interativo py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </button>
          </div>

          <div className="mt-7 text-center text-xs text-[#8B9493]">
            Acesso restrito a colaboradores autorizados. Em caso de dúvidas, contate o suporte interno.
          </div>
        </form>
      </div>
    </div>
  );
}

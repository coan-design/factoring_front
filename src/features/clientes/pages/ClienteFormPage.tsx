import { useEffect, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { mapApiErrorsToForm } from '../../../lib/api-errors';
import type { TipoCliente } from '../../../types/cliente';
import { useCliente } from '../hooks/useClienteDetalhe';
import {
  useAtualizarCliente,
  useAtualizarEndereco,
  useCriarCliente,
  useCriarEndereco,
  type ClientePayload,
} from '../hooks/useClienteFormulario';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

interface ClienteFormValues {
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

/**
 * Tradução de design/ClientesFormulario.dc.html — sem razaoSocial, nomeFantasia,
 * inscricaoEstadual ou RG: o model Cliente do backend só tem `nome` e `cpfCnpj`
 * (um campo cada, PF ou PJ). O mockup também não tem campo "Número" do
 * endereço, mas CreateEnderecoDto exige — adicionado aqui.
 */
export function ClienteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const modoEdicao = !!id;
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('PESSOA_JURIDICA');
  const [formError, setFormError] = useState('');

  const { data: cliente, isLoading: carregandoCliente } = useCliente(id ?? '');
  const criarEndereco = useCriarEndereco();
  const atualizarEndereco = useAtualizarEndereco();
  const criarCliente = useCriarCliente();
  const atualizarCliente = useAtualizarCliente(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClienteFormValues>();

  useEffect(() => {
    if (cliente) {
      setTipoCliente(cliente.tipoCliente);
      reset({
        nome: cliente.nome,
        cpfCnpj: cliente.cpfCnpj,
        telefone: cliente.telefone,
        email: cliente.email,
        logradouro: cliente.endereco?.logradouro ?? '',
        numero: cliente.endereco?.numero ?? '',
        bairro: cliente.endereco?.bairro ?? '',
        cidade: cliente.endereco?.cidade ?? '',
        estado: cliente.endereco?.estado ?? 'SP',
        cep: cliente.endereco?.cep ?? '',
      });
    }
  }, [cliente, reset]);

  const salvando = criarCliente.isPending || atualizarCliente.isPending || criarEndereco.isPending || atualizarEndereco.isPending;

  async function onSubmit(values: ClienteFormValues) {
    setFormError('');
    const enderecoPayload = {
      cep: values.cep,
      logradouro: values.logradouro,
      numero: values.numero,
      bairro: values.bairro,
      cidade: values.cidade,
      estado: values.estado,
    };

    try {
      let enderecoId = cliente?.enderecoId ?? undefined;
      if (enderecoId) {
        await atualizarEndereco.mutateAsync({ id: enderecoId, payload: enderecoPayload });
      } else {
        const endereco = await criarEndereco.mutateAsync(enderecoPayload);
        enderecoId = endereco.id;
      }

      const clientePayload: ClientePayload = {
        nome: values.nome,
        cpfCnpj: values.cpfCnpj,
        tipoCliente,
        email: values.email,
        telefone: values.telefone,
        enderecoId,
      };

      const salvo = modoEdicao
        ? await atualizarCliente.mutateAsync(clientePayload)
        : await criarCliente.mutateAsync(clientePayload);

      navigate(`/clientes/${salvo.id}`, { replace: true });
    } catch (error) {
      setFormError(mapApiErrorsToForm(error, setError));
    }
  }

  if (modoEdicao && carregandoCliente) {
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
            <div className="text-xs text-muted">Início / Clientes / {modoEdicao ? 'Editar' : 'Novo'}</div>
            <h1 className="mt-0.5 font-display text-2xl font-semibold">
              {modoEdicao ? 'Editar cliente' : 'Novo cliente'}
            </h1>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Salvar cliente'}
            </button>
          </div>
        </div>

        <div className="max-w-[760px] px-10 py-8">
          <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[26px]">
            <LedgerCorner tone="neutral" />

            <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">Tipo de cliente</div>
            <div className="mb-[26px] inline-flex rounded-[7px] border border-border p-[3px]">
              <button
                type="button"
                onClick={() => setTipoCliente('PESSOA_JURIDICA')}
                className={`rounded-[5px] px-5 py-2 text-[13.5px] font-semibold ${
                  tipoCliente === 'PESSOA_JURIDICA' ? 'bg-petroleo-interativo text-white' : 'text-muted-foreground'
                }`}
              >
                Pessoa Jurídica
              </button>
              <button
                type="button"
                onClick={() => setTipoCliente('PESSOA_FISICA')}
                className={`rounded-[5px] px-5 py-2 text-[13.5px] font-semibold ${
                  tipoCliente === 'PESSOA_FISICA' ? 'bg-petroleo-interativo text-white' : 'text-muted-foreground'
                }`}
              >
                Pessoa Física
              </button>
            </div>

            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Dados cadastrais</div>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <TextField
                  label={tipoCliente === 'PESSOA_JURIDICA' ? 'Razão social' : 'Nome completo'}
                  placeholder={tipoCliente === 'PESSOA_JURIDICA' ? 'Ex: Fecal Distribuidora Ltda.' : 'Ex: João Carlos Menezes'}
                  register={register('nome', { required: 'Informe o nome' })}
                  error={errors.nome}
                />
              </div>
              <TextField
                label={tipoCliente === 'PESSOA_JURIDICA' ? 'CNPJ' : 'CPF'}
                placeholder={tipoCliente === 'PESSOA_JURIDICA' ? '00.000.000/0001-00' : '000.000.000-00'}
                mono
                register={register('cpfCnpj', { required: 'Informe o documento' })}
                error={errors.cpfCnpj}
              />
              <TextField
                label="Telefone"
                placeholder="(00) 0000-0000"
                register={register('telefone', { required: 'Informe o telefone' })}
                error={errors.telefone}
              />
              <div className="col-span-2">
                <TextField
                  label="E-mail"
                  placeholder="financeiro@empresa.com.br"
                  register={register('email', { required: 'Informe o e-mail' })}
                  error={errors.email}
                />
              </div>
            </div>

            <div className="mb-6 h-px bg-border-subtle" />

            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Endereço</div>
            <div className="mb-4 grid grid-cols-[2fr_1fr_1fr] gap-4">
              <TextField
                label="Logradouro"
                placeholder="Rua, avenida, complemento"
                register={register('logradouro', { required: 'Informe o logradouro' })}
                error={errors.logradouro}
              />
              <TextField
                label="Número"
                placeholder="000"
                mono
                register={register('numero', { required: 'Informe o número' })}
                error={errors.numero}
              />
              <TextField
                label="CEP"
                placeholder="00000-000"
                mono
                register={register('cep', { required: 'Informe o CEP' })}
                error={errors.cep}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <TextField
                label="Bairro"
                placeholder="Bairro"
                register={register('bairro', { required: 'Informe o bairro' })}
                error={errors.bairro}
              />
              <TextField
                label="Cidade"
                placeholder="Cidade"
                register={register('cidade', { required: 'Informe a cidade' })}
                error={errors.cidade}
              />
              <div>
                <label htmlFor="estado" className="text-[12.5px] font-medium text-muted-foreground">
                  UF
                </label>
                <select
                  id="estado"
                  className="mt-1.5 w-full rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px]"
                  {...register('estado', { required: 'Informe a UF' })}
                >
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                {errors.estado && <p className="mt-1 text-xs text-vermelho-critico">{errors.estado.message}</p>}
              </div>
            </div>

            {formError && <p className="mt-5 text-xs text-vermelho-critico">{formError}</p>}
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function TextField({
  label,
  placeholder,
  mono,
  register,
  error,
}: {
  label: string;
  placeholder: string;
  mono?: boolean;
  register: UseFormRegisterReturn;
  error?: { message?: string };
}) {
  return (
    <div>
      <label htmlFor={register.name} className="text-[12.5px] font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={register.name}
        placeholder={placeholder}
        className={`mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px] ${mono ? 'tabnum font-mono' : ''}`}
        {...register}
      />
      {error && <p className="mt-1 text-xs text-vermelho-critico">{error.message}</p>}
    </div>
  );
}

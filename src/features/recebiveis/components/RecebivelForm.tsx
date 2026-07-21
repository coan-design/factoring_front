import { useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { mapApiErrorsToForm } from '../../../lib/api-errors';
import type { TipoRecebivel } from '../../../types/recebivel';
import { useClientesAtivos } from '../../clientes/hooks/useClientes';
import { nomeExibicaoCliente } from '../../../types/cliente';
import { useCriarRecebivel, type CriarRecebivelPayload } from '../hooks/useCriarRecebivel';

interface RecebivelFormValues {
  clienteId: string;
  valorNominal: number;
  dataVencimento: string;
  numeroDuplicata?: string;
  numeroNotaFiscal?: string;
  sacado?: string;
  banco?: string;
  agencia?: string;
  numeroCheque?: string;
  emitente?: string;
}

/** Tradução 1:1 de design/RecebiveisFormulario.dc.html. */
export function RecebivelForm() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoRecebivel>('CHEQUE');
  const [formError, setFormError] = useState('');
  const clientesAtivos = useClientesAtivos();
  const criarRecebivel = useCriarRecebivel();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RecebivelFormValues>();

  async function onSubmit(values: RecebivelFormValues) {
    setFormError('');
    const payload: CriarRecebivelPayload = {
      tipo,
      clienteId: values.clienteId,
      valorNominal: Number(values.valorNominal),
      dataVencimento: values.dataVencimento,
      ...(tipo === 'DUPLICATA'
        ? { numeroDuplicata: values.numeroDuplicata, numeroNotaFiscal: values.numeroNotaFiscal, sacado: values.sacado }
        : { banco: values.banco, agencia: values.agencia, numeroCheque: values.numeroCheque, emitente: values.emitente }),
    };
    try {
      await criarRecebivel.mutateAsync(payload);
      navigate('/recebiveis', { replace: true });
    } catch (error) {
      setFormError(mapApiErrorsToForm(error, setError));
    }
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
          <div>
            <div className="text-xs text-muted">Início / Recebíveis / Novo</div>
            <h1 className="mt-0.5 font-display text-2xl font-semibold">Novo recebível</h1>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/recebiveis')}
              className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criarRecebivel.isPending}
              className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {criarRecebivel.isPending ? 'Salvando…' : 'Salvar recebível'}
            </button>
          </div>
        </div>

        <div className="max-w-[760px] px-10 py-8">
          <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[26px]">
            <LedgerCorner tone="neutral" />

            <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Tipo de recebível
            </div>
            <div className="mb-[26px] inline-flex rounded-[7px] border border-border p-[3px]">
              <button
                type="button"
                onClick={() => setTipo('CHEQUE')}
                className={`rounded-[5px] px-5 py-2 text-[13.5px] font-semibold ${
                  tipo === 'CHEQUE' ? 'bg-petroleo-interativo text-white' : 'text-muted-foreground'
                }`}
              >
                Cheque
              </button>
              <button
                type="button"
                onClick={() => setTipo('DUPLICATA')}
                className={`rounded-[5px] px-5 py-2 text-[13.5px] font-semibold ${
                  tipo === 'DUPLICATA' ? 'bg-petroleo-interativo text-white' : 'text-muted-foreground'
                }`}
              >
                Duplicata
              </button>
            </div>

            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Dados gerais</div>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="clienteId" className="text-[12.5px] font-medium text-muted-foreground">
                  Cliente (cedente)
                </label>
                <select
                  id="clienteId"
                  className="mt-1.5 w-full rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px]"
                  {...register('clienteId', { required: 'Selecione o cliente' })}
                >
                  <option value="">Selecione…</option>
                  {clientesAtivos.data?.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {nomeExibicaoCliente(cliente)}
                    </option>
                  ))}
                </select>
                {errors.clienteId && <p className="mt-1 text-xs text-vermelho-critico">{errors.clienteId.message}</p>}
              </div>
              <div>
                <label htmlFor="valorNominal" className="text-[12.5px] font-medium text-muted-foreground">
                  Valor de face
                </label>
                <input
                  id="valorNominal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="R$ 0,00"
                  className="tabnum mt-1.5 w-full rounded-control border border-border px-3 py-2.5 font-mono text-[13.5px]"
                  {...register('valorNominal', { required: 'Informe o valor', valueAsNumber: true, min: 0.01 })}
                />
                {errors.valorNominal && (
                  <p className="mt-1 text-xs text-vermelho-critico">{errors.valorNominal.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="dataVencimento" className="text-[12.5px] font-medium text-muted-foreground">
                  Data de vencimento
                </label>
                <input
                  id="dataVencimento"
                  type="date"
                  className="tabnum mt-1.5 w-full rounded-control border border-border px-3 py-2.5 font-mono text-[13.5px]"
                  {...register('dataVencimento', { required: 'Informe o vencimento' })}
                />
                {errors.dataVencimento && (
                  <p className="mt-1 text-xs text-vermelho-critico">{errors.dataVencimento.message}</p>
                )}
              </div>
            </div>

            <div className="mb-6 h-px bg-border-subtle" />

            {tipo === 'CHEQUE' ? (
              <>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Dados do cheque</div>
                <div className="grid grid-cols-2 gap-4">
                  <TextField label="Banco" placeholder="Ex: Itaú Unibanco" register={register('banco', { required: 'Informe o banco' })} error={errors.banco} />
                  <TextField label="Agência" placeholder="0000" mono register={register('agencia', { required: 'Informe a agência' })} error={errors.agencia} />
                  <TextField
                    label="Número do cheque"
                    placeholder="000000"
                    mono
                    register={register('numeroCheque', { required: 'Informe o número do cheque' })}
                    error={errors.numeroCheque}
                  />
                  <TextField label="Emitente" placeholder="Nome no cheque" register={register('emitente', { required: 'Informe o emitente' })} error={errors.emitente} />
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Dados da duplicata</div>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Número da duplicata"
                    placeholder="DP-00000"
                    mono
                    register={register('numeroDuplicata', { required: 'Informe o número da duplicata' })}
                    error={errors.numeroDuplicata}
                  />
                  <TextField label="Nota fiscal" placeholder="Nº NF-e" mono register={register('numeroNotaFiscal', { required: 'Informe a nota fiscal' })} error={errors.numeroNotaFiscal} />
                  <div className="col-span-2">
                    <TextField label="Sacado" placeholder="Empresa devedora da duplicata" register={register('sacado', { required: 'Informe o sacado' })} error={errors.sacado} />
                  </div>
                </div>
              </>
            )}

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

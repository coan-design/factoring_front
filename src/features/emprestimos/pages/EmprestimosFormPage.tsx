import { useRef, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { mapApiErrorsToForm } from '../../../lib/api-errors';
import { formatarMoeda } from '../../../lib/format';
import { useClientesAtivos } from '../../clientes/hooks/useClientes';
import { nomeExibicaoCliente } from '../../../types/cliente';
import type { Emprestimo } from '../../../types/emprestimo';
import { useEmprestimo } from '../hooks/useEmprestimo';
import { useCriarEmprestimo, useUploadContratoEmprestimo, type CriarEmprestimoPayload } from '../hooks/useEmprestimoFormulario';

interface EmprestimoFormValues {
  clienteId: string;
  valorEmprestado: number;
  dataContratacao: string;
  taxaJuros: number;
  quantidadeParcelas: number;
}

/**
 * Tradução de design/EmprestimosFormulario.dc.html.
 *
 * `/emprestimos/novo`: formulário completo. `tipoJuros` não aparece no
 * mockup mas é obrigatório no backend — fixado em SIMPLES (o mesmo cálculo
 * usado no "Total a receber (estimado)"). O upload do contrato só fica
 * disponível depois que o POST /emprestimos retorna um id — o formulário
 * permanece na tela após salvar, com os dados do contrato travados e o
 * bloco de upload liberado (não navega embora sem dar chance de anexar).
 *
 * `/emprestimos/:id/editar`: o backend gera as parcelas automaticamente na
 * criação e não as regenera se o empréstimo for alterado depois (PATCH
 * /emprestimos/:id não recalcula ParcelaEmprestimo) — editar valor, taxa,
 * parcelas ou data de contratação depois de criado dessincronizaria as
 * parcelas já geradas. Por isso esta tela (que o próprio ComingSoon
 * anterior já chamava de "Editar contrato de empréstimo") só permite
 * reanexar o contrato; os dados do empréstimo aparecem travados, como
 * contexto.
 */
export function EmprestimosFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const modoEdicao = !!id;

  const clientesAtivos = useClientesAtivos();
  const criarEmprestimo = useCriarEmprestimo();
  const { data: emprestimoExistente, isLoading: carregando } = useEmprestimo(id ?? '');
  const [emprestimoSalvo, setEmprestimoSalvo] = useState<Emprestimo | null>(null);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<EmprestimoFormValues>();

  const emprestimoAtivo = modoEdicao ? emprestimoExistente : emprestimoSalvo;
  const travado = modoEdicao || !!emprestimoSalvo;

  const valorEmprestado = watch('valorEmprestado');
  const taxaJuros = watch('taxaJuros');
  const quantidadeParcelas = watch('quantidadeParcelas');
  const totalEstimado =
    !travado && valorEmprestado > 0 && quantidadeParcelas > 0
      ? valorEmprestado * (1 + (Number(taxaJuros || 0) / 100) * quantidadeParcelas)
      : emprestimoAtivo?.valorEmprestado
        ? emprestimoAtivo.valorEmprestado * (1 + emprestimoAtivo.taxaJuros * emprestimoAtivo.quantidadeParcelas)
        : 0;

  async function onSubmit(values: EmprestimoFormValues) {
    setFormError('');
    const payload: CriarEmprestimoPayload = {
      clienteId: values.clienteId,
      valorEmprestado: Number(values.valorEmprestado),
      tipoJuros: 'SIMPLES',
      taxaJuros: Number(values.taxaJuros) / 100,
      quantidadeParcelas: Number(values.quantidadeParcelas),
      dataContratacao: values.dataContratacao,
    };
    try {
      const criado = await criarEmprestimo.mutateAsync(payload);
      setEmprestimoSalvo(criado);
    } catch (error) {
      setFormError(mapApiErrorsToForm(error, setError));
    }
  }

  if (modoEdicao && carregando) {
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
            <div className="text-xs text-muted">
              Início / Empréstimos / {modoEdicao ? 'Editar contrato' : 'Novo'}
            </div>
            <h1 className="mt-0.5 font-display text-2xl font-semibold">
              {modoEdicao ? 'Editar contrato de empréstimo' : 'Novo empréstimo'}
            </h1>
          </div>
          <div className="flex gap-2.5">
            {modoEdicao ? (
              <Link
                to={`/emprestimos/${id}`}
                className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium no-underline"
              >
                Voltar ao empréstimo
              </Link>
            ) : emprestimoSalvo ? (
              <button
                type="button"
                onClick={() => navigate(`/emprestimos/${emprestimoSalvo.id}`)}
                className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white"
              >
                Concluir
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/emprestimos')}
                  className="rounded-control border border-border bg-white px-4 py-2.5 text-[13.5px] font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarEmprestimo.isPending}
                  className="rounded-control bg-petroleo-interativo px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
                >
                  {criarEmprestimo.isPending ? 'Salvando…' : 'Salvar empréstimo'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-10 py-8">
          <div className="grid max-w-[980px] grid-cols-[1.3fr_1fr] gap-[18px]">
            <div className="rounded-panel border border-border bg-surface p-[26px]">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Dados do contrato</div>

              {travado && emprestimoAtivo ? (
                <div className="mb-6 grid grid-cols-2 gap-x-[18px] gap-y-3.5">
                  <ReadField label="Cliente (tomador)" value={emprestimoAtivo.cliente?.nome ?? emprestimoAtivo.clienteId} span2 />
                  <ReadField label="Valor emprestado" value={formatarMoeda(emprestimoAtivo.valorEmprestado)} mono />
                  <ReadField label="Data de contratação" value={new Date(emprestimoAtivo.dataContratacao).toLocaleDateString('pt-BR')} mono />
                  <ReadField label="Taxa de juros" value={`${(emprestimoAtivo.taxaJuros * 100).toLocaleString('pt-BR')}% a.m.`} mono />
                  <ReadField label="Número de parcelas" value={String(emprestimoAtivo.quantidadeParcelas)} mono />
                </div>
              ) : (
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="clienteId" className="text-[12.5px] font-medium text-muted-foreground">
                      Cliente (tomador)
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
                  <NumberField
                    label="Valor emprestado"
                    placeholder="R$ 0,00"
                    register={register('valorEmprestado', { required: 'Informe o valor emprestado', valueAsNumber: true, min: 0.01 })}
                    error={errors.valorEmprestado}
                  />
                  <div>
                    <label htmlFor="dataContratacao" className="text-[12.5px] font-medium text-muted-foreground">
                      Data de contratação
                    </label>
                    <input
                      id="dataContratacao"
                      type="date"
                      className="tabnum mt-1.5 w-full rounded-control border border-border px-3 py-2.5 font-mono text-[13.5px]"
                      {...register('dataContratacao', { required: 'Informe a data de contratação' })}
                    />
                    {errors.dataContratacao && (
                      <p className="mt-1 text-xs text-vermelho-critico">{errors.dataContratacao.message}</p>
                    )}
                  </div>
                  <NumberField
                    label="Taxa de juros (% a.m.)"
                    placeholder="2,4"
                    step="0.01"
                    register={register('taxaJuros', { required: 'Informe a taxa de juros mensal', valueAsNumber: true, min: 0 })}
                    error={errors.taxaJuros}
                  />
                  <NumberField
                    label="Número de parcelas"
                    placeholder="12"
                    step="1"
                    register={register('quantidadeParcelas', {
                      required: 'Informe o número de parcelas',
                      valueAsNumber: true,
                      min: 1,
                    })}
                    error={errors.quantidadeParcelas}
                  />
                </div>
              )}

              <div className="mb-5 h-px bg-border-subtle" />

              <div className="flex items-center justify-between rounded-[8px] border border-[#DCEBEA] bg-[#F6FAFA] px-4 py-3.5">
                <div>
                  <div className="text-[12.5px] font-semibold text-petroleo-tinta">
                    {travado ? 'Total a receber' : 'Total a receber (estimado)'}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted">Principal + juros, ao gerar as parcelas</div>
                </div>
                <div className="tabnum font-mono text-lg font-bold text-petroleo-tinta">
                  {travado ? formatarMoeda(totalEstimado) : `~ ${formatarMoeda(totalEstimado)}`}
                </div>
              </div>

              {formError && <p className="mt-5 text-xs text-vermelho-critico">{formError}</p>}
            </div>

            <ContratoPanel emprestimoId={emprestimoAtivo?.id} contratoUrl={emprestimoAtivo?.contratoUrl} />
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function ReadField({ label, value, mono, span2 }: { label: string; value: string; mono?: boolean; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : undefined}>
      <div className="text-[11.5px] text-muted">{label}</div>
      <div className={`mt-0.5 text-[13.5px] ${mono ? 'tabnum font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function NumberField({
  label,
  placeholder,
  step,
  register,
  error,
}: {
  label: string;
  placeholder: string;
  step?: string;
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
        type="number"
        step={step ?? '0.01'}
        min="0"
        placeholder={placeholder}
        className="tabnum mt-1.5 w-full rounded-control border border-border px-3 py-2.5 font-mono text-[13.5px]"
        {...register}
      />
      {error && <p className="mt-1 text-xs text-vermelho-critico">{error.message}</p>}
    </div>
  );
}

function ContratoPanel({ emprestimoId, contratoUrl }: { emprestimoId?: string; contratoUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState('');
  const upload = useUploadContratoEmprestimo(emprestimoId ?? '');

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo || !emprestimoId) return;
    setErro('');
    try {
      await upload.mutateAsync(arquivo);
    } catch {
      setErro('Não foi possível enviar o contrato. Use JPEG, PNG ou PDF de até 10MB.');
    }
  }

  return (
    <div className="rounded-panel border border-border bg-surface p-[22px]">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Contrato assinado</div>
      <div className="mb-3 text-[12.5px] text-muted">Upload da imagem ou PDF digitalizado do contrato.</div>
      {emprestimoId ? (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            className="flex h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[8px] border border-dashed border-border bg-surface-sunken text-center"
          >
            {contratoUrl ? (
              contratoUrl.endsWith('.pdf') ? (
                <a href={contratoUrl} target="_blank" rel="noreferrer" className="text-[13px] text-petroleo-interativo">
                  Ver contrato (PDF)
                </a>
              ) : (
                <img src={contratoUrl} alt="Contrato assinado" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="px-4 text-[12.5px] text-muted">{upload.isPending ? 'Enviando…' : 'Upload do contrato'}</div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={onFileSelected} />
          {erro && <p className="mt-1.5 text-xs text-vermelho-critico">{erro}</p>}
        </>
      ) : (
        <div className="flex h-[220px] flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-[#F7F8F7] px-4 text-center text-[12.5px] text-muted">
          Disponível depois de salvar o empréstimo.
        </div>
      )}
    </div>
  );
}

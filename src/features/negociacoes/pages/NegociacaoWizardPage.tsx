import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { LedgerCorner } from '../../../components/shared/LedgerCorner';
import { formatarData, formatarMoeda } from '../../../lib/format';
import { nomeExibicaoCliente, type Cliente } from '../../../types/cliente';
import { montarItensDaTabela, type FormaPagamento, type TipoNegociacao } from '../../../types/negociacao';
import { useNegociacao } from '../hooks/useNegociacao';
import {
  useAdicionarItemEmprestimo,
  useAdicionarItemRecebivel,
  useAprovarNegociacao,
  useAtualizarTarifasNegociacao,
  useCancelarNegociacao,
  useClientesBusca,
  useCriarNegociacao,
  useItensDisponiveisCliente,
} from '../hooks/useNegociacaoWizard';

interface ItemParams {
  quantidadeDias: number;
  taxaDesagio: number;
}

function diasAte(dataIso: string): number {
  const diff = new Date(dataIso).getTime() - Date.now();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

const STEP_LABELS = ['Cliente', 'Itens', 'Cálculo', 'Confirmação'];

/**
 * Tradução de design/NegociacoesWizard.dc.html — com uma diferença
 * deliberada do mockup: a negociação e seus itens são criados de verdade
 * na transição do passo 2 para o 3 (não só no passo 4), porque
 * valorBruto/valorTotalReceber/valorPago/valorAReceber são calculados pelo
 * backend a partir do deságio real de cada item — não há como prever esses
 * números no frontend sem reimplementar a fórmula do backend. Por isso o
 * passo 2 mostra só o valor de face (fato real e já conhecido) de cada
 * item, e os passos 3/4 mostram os valores reais devolvidos pela API.
 */
export function NegociacaoWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [erro, setErro] = useState('');

  // Passo 1
  const [numero, setNumero] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const clientesBusca = useClientesBusca(buscaCliente);

  // Passo 2
  const itensDisponiveis = useItensDisponiveisCliente(cliente?.id ?? '');
  const [selecionadosRecebivel, setSelecionadosRecebivel] = useState<Set<string>>(new Set());
  const [selecionadosEmprestimo, setSelecionadosEmprestimo] = useState<Set<string>>(new Set());
  const [itemParams, setItemParams] = useState<Record<string, ItemParams>>({});

  // Negociação real, criada na transição 2 → 3
  const [negociacaoId, setNegociacaoId] = useState<string | null>(null);
  const [tarifasInput, setTarifasInput] = useState(0);
  const [criando, setCriando] = useState(false);

  const criarNegociacao = useCriarNegociacao();
  const adicionarRecebivel = useAdicionarItemRecebivel();
  const adicionarEmprestimo = useAdicionarItemEmprestimo();
  const negociacao = useNegociacao(negociacaoId ?? '');
  const atualizarTarifas = useAtualizarTarifasNegociacao(negociacaoId ?? '');
  const aprovar = useAprovarNegociacao(negociacaoId ?? '');
  const cancelar = useCancelarNegociacao(negociacaoId ?? '');

  function paramsDoItem(id: string): ItemParams {
    const recebivel = itensDisponiveis.recebiveis.find((r) => r.id === id);
    return itemParams[id] ?? { quantidadeDias: recebivel ? diasAte(recebivel.dataVencimento) : 30, taxaDesagio: 0 };
  }

  function toggleRecebivel(id: string) {
    setSelecionadosRecebivel((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleEmprestimo(id: string) {
    setSelecionadosEmprestimo((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalItensSelecionados = selecionadosRecebivel.size + selecionadosEmprestimo.size;
  const valorFaceSelecionado =
    itensDisponiveis.recebiveis
      .filter((r) => selecionadosRecebivel.has(r.id))
      .reduce((soma, r) => soma + r.valorNominal, 0) +
    itensDisponiveis.emprestimos
      .filter((e) => selecionadosEmprestimo.has(e.id))
      .reduce((soma, e) => soma + e.valorEmprestado, 0);

  async function avancarDoPasso2() {
    setErro('');
    const recebiveisSelecionados = itensDisponiveis.recebiveis.filter((r) => selecionadosRecebivel.has(r.id));
    if (recebiveisSelecionados.some((r) => paramsDoItem(r.id).taxaDesagio <= 0)) {
      setErro('Informe a taxa de deságio (maior que zero) para todos os recebíveis selecionados.');
      return;
    }

    const tipoNegociacao: TipoNegociacao =
      selecionadosRecebivel.size > 0 && selecionadosEmprestimo.size > 0
        ? 'MISTA'
        : selecionadosEmprestimo.size > 0
          ? 'EMPRESTIMO'
          : 'RECEBIVEIS';

    setCriando(true);
    try {
      const criada = await criarNegociacao.mutateAsync({
        numero,
        titulo,
        descricao: descricao || undefined,
        clienteId: cliente!.id,
        tipoNegociacao,
        formaPagamento,
      });
      setNegociacaoId(criada.id);

      for (const r of recebiveisSelecionados) {
        const params = paramsDoItem(r.id);
        await adicionarRecebivel.mutateAsync({
          negociacaoId: criada.id,
          recebivelId: r.id,
          quantidadeDias: params.quantidadeDias,
          taxaDesagio: params.taxaDesagio,
        });
      }
      for (const e of itensDisponiveis.emprestimos.filter((e) => selecionadosEmprestimo.has(e.id))) {
        await adicionarEmprestimo.mutateAsync({ negociacaoId: criada.id, emprestimoId: e.id });
      }

      setStep(3);
    } catch {
      setErro('Não foi possível criar a negociação ou adicionar todos os itens. Tente novamente.');
    } finally {
      setCriando(false);
    }
  }

  async function cancelarWizard() {
    if (negociacaoId) {
      try {
        await cancelar.mutateAsync();
      } catch {
        // segue para navegação mesmo se o cancelamento falhar — não travar o usuário aqui
      }
    }
    navigate('/negociacoes');
  }

  async function aprovarEConcluir() {
    setErro('');
    try {
      await aprovar.mutateAsync();
      navigate(`/negociacoes/${negociacaoId}`, { replace: true });
    } catch {
      setErro('Não foi possível aprovar a negociação. Verifique se todos os itens foram adicionados corretamente.');
    }
  }

  return (
    <AppShell>
      <form
        className="flex h-full flex-col"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="border-b border-border bg-surface px-10 py-6">
          <div className="text-xs text-muted">Início / Negociações / Nova negociação</div>
          <h1 className="mt-0.5 font-display text-2xl font-semibold">Nova negociação</h1>
        </div>

        <div className="border-b border-border bg-surface px-10 pt-6">
          <div className="flex gap-1 pb-5">
            {STEP_LABELS.map((label, i) => {
              const key = i + 1;
              const done = key < step;
              const active = key === step;
              return (
                <div key={key} className="relative flex-1">
                  <div
                    className="h-1.5 rounded-[3px]"
                    style={{ background: done || active ? '#1F6F72' : '#E2E6E5' }}
                  />
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <div
                      className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center"
                      style={{
                        background: done ? '#1F6F72' : active ? '#123B3D' : '#E2E6E5',
                        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 65% 100%, 0 100%)',
                      }}
                    >
                      {done ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12l5 5L20 6" />
                        </svg>
                      ) : (
                        <span className="text-[10.5px] font-bold" style={{ color: active ? 'white' : '#8B9493' }}>
                          {key}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[12.5px] font-semibold"
                      style={{ color: active ? '#123B3D' : done ? '#4B5453' : '#8B9493' }}
                    >
                      {label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8 pb-24">
          {step === 1 && (
            <div className="max-w-[620px]">
              <div className="mb-[18px] text-[15px] font-semibold">Identificação e cliente</div>

              <div className="mb-5 rounded-panel border border-border bg-surface p-[22px]">
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="numero" className="text-[12.5px] font-medium text-muted-foreground">
                      Número da negociação
                    </label>
                    <input
                      id="numero"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="Ex: NG-2026-0342"
                      className="tabnum mt-1.5 w-full rounded-control border border-border px-3 py-2.5 font-mono text-[13.5px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="titulo" className="text-[12.5px] font-medium text-muted-foreground">
                      Título da negociação
                    </label>
                    <input
                      id="titulo"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: Cessão de carteira julho — Fecal"
                      className="mt-1.5 w-full rounded-control border border-border px-3 py-2.5 text-[13.5px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="descricao" className="text-[12.5px] font-medium text-muted-foreground">
                      Descrição
                    </label>
                    <textarea
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Contexto da negociação, observações internas"
                      rows={3}
                      className="mt-1.5 w-full resize-y rounded-control border border-border px-3 py-2.5 text-[13.5px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="formaPagamento" className="text-[12.5px] font-medium text-muted-foreground">
                      Forma de pagamento
                    </label>
                    <select
                      id="formaPagamento"
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                      className="mt-1.5 w-full rounded-control border border-border bg-white px-3 py-2.5 text-[13.5px]"
                    >
                      <option value="PIX">PIX</option>
                      <option value="TED">TED</option>
                      <option value="BOLETO">Boleto</option>
                      <option value="DINHEIRO">Dinheiro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">Cliente</div>
              <div className="relative mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B9493" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  value={buscaCliente}
                  onChange={(e) => {
                    setBuscaCliente(e.target.value);
                    setCliente(null);
                  }}
                  placeholder="Buscar cliente"
                  className="w-full rounded-control border border-border bg-white py-2.5 pl-9 pr-3 text-[13.5px]"
                />
              </div>
              <div className="overflow-hidden rounded-panel border border-border bg-surface">
                {clientesBusca.isLoading && <div className="px-[18px] py-4 text-[13px] text-muted">Buscando…</div>}
                {!clientesBusca.isLoading && buscaCliente && clientesBusca.data?.length === 0 && (
                  <div className="px-[18px] py-4 text-[13px] text-muted">Nenhum cliente encontrado.</div>
                )}
                {clientesBusca.data?.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCliente(c);
                      setBuscaCliente(nomeExibicaoCliente(c));
                    }}
                    className="flex cursor-pointer items-center justify-between border-b border-border-subtle px-[18px] py-3.5"
                    style={{ background: cliente?.id === c.id ? '#EFF4F4' : 'white' }}
                  >
                    <div>
                      <div className="text-[13.5px] font-semibold">{nomeExibicaoCliente(c)}</div>
                      <div className="mt-0.5 text-xs text-muted">{c.cpfCnpj}</div>
                    </div>
                    {cliente?.id === c.id && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-petroleo-interativo">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <path d="M4 12l5 5L20 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && cliente && (
            <div>
              <div className="mb-1 text-[15px] font-semibold">Selecione os recebíveis e empréstimos</div>
              <div className="mb-[18px] text-[13px] text-muted">
                Cliente: {nomeExibicaoCliente(cliente)} · empréstimos entram inteiros, com todas as parcelas (pagas e
                pendentes)
              </div>
              <div className="overflow-hidden rounded-panel border border-border bg-surface">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-surface-sunken">
                      <th className="w-11 border-b border-border px-[18px] py-2.5" />
                      <th className="border-b border-border px-[18px] py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">
                        Item
                      </th>
                      <th className="border-b border-border px-[18px] py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">
                        Detalhe
                      </th>
                      <th className="border-b border-border px-[18px] py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide text-muted">
                        Valor de face
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensDisponiveis.isLoading && (
                      <tr>
                        <td colSpan={4} className="px-[18px] py-6 text-center text-[13px] text-muted">
                          Carregando…
                        </td>
                      </tr>
                    )}
                    {itensDisponiveis.recebiveis.map((r) => {
                      const checked = selecionadosRecebivel.has(r.id);
                      const params = paramsDoItem(r.id);
                      return (
                        <tr
                          key={r.id}
                          onClick={() => toggleRecebivel(r.id)}
                          className="cursor-pointer border-b border-border-subtle align-top hover:bg-surface-sunken"
                          style={{ background: checked ? '#F6FAFA' : 'white' }}
                        >
                          <td className="px-[18px] py-3.5">
                            <Checkbox checked={checked} />
                          </td>
                          <td className="px-[18px] py-3.5">
                            <div className="text-[13.5px] font-semibold">
                              {r.tipo === 'DUPLICATA' ? 'Duplicata' : 'Cheque'}
                            </div>
                            <div className="tabnum mt-0.5 font-mono text-xs text-muted">
                              {r.numeroNotaFiscal ?? r.numeroCheque ?? r.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="px-[18px] py-3.5">
                            <div className="text-[13px] text-muted-foreground">
                              Vence {formatarData(r.dataVencimento)}
                            </div>
                            {checked && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 flex gap-3"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11.5px] text-muted">Prazo</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={params.quantidadeDias}
                                    onChange={(e) =>
                                      setItemParams((s) => ({
                                        ...s,
                                        [r.id]: { ...paramsDoItem(r.id), quantidadeDias: parseInt(e.target.value, 10) || 0 },
                                      }))
                                    }
                                    className="tabnum w-14 rounded-[5px] border border-border px-1.5 py-1 text-right font-mono text-xs"
                                  />
                                  <span className="text-[11.5px] text-muted">dias</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11.5px] text-muted">Deságio</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={params.taxaDesagio}
                                    onChange={(e) =>
                                      setItemParams((s) => ({
                                        ...s,
                                        [r.id]: { ...paramsDoItem(r.id), taxaDesagio: parseFloat(e.target.value) || 0 },
                                      }))
                                    }
                                    className="tabnum w-14 rounded-[5px] border border-border px-1.5 py-1 text-right font-mono text-xs"
                                  />
                                  <span className="text-[11.5px] text-muted">% a.m.</span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="tabnum px-[18px] py-3.5 text-right font-mono text-[13.5px] font-semibold">
                            {formatarMoeda(r.valorNominal)}
                          </td>
                        </tr>
                      );
                    })}
                    {itensDisponiveis.emprestimos.map((e) => {
                      const checked = selecionadosEmprestimo.has(e.id);
                      const parcelasPagas = e.parcelas.filter((p) => p.status === 'PAGA').length;
                      return (
                        <tr
                          key={e.id}
                          onClick={() => toggleEmprestimo(e.id)}
                          className="cursor-pointer border-b border-border-subtle align-top hover:bg-surface-sunken"
                          style={{ background: checked ? '#F6FAFA' : 'white' }}
                        >
                          <td className="px-[18px] py-3.5">
                            <Checkbox checked={checked} />
                          </td>
                          <td className="px-[18px] py-3.5">
                            <div className="text-[13.5px] font-semibold">Empréstimo</div>
                            <div className="tabnum mt-0.5 font-mono text-xs text-muted">
                              {e.id.slice(0, 8).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-[18px] py-3.5">
                            <div className="text-[13px] text-muted-foreground">
                              Contratado {formatarData(e.dataContratacao)}
                            </div>
                            <div className="mt-0.5 text-xs font-semibold text-ambar-atencao">
                              Entra inteiro · {parcelasPagas} pagas de {e.quantidadeParcelas}
                            </div>
                          </td>
                          <td className="tabnum px-[18px] py-3.5 text-right font-mono text-[13.5px] font-semibold">
                            {formatarMoeda(e.valorEmprestado)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 3 && negociacao.data && (
            <div className="max-w-[680px]">
              <div className="mb-1 text-[15px] font-semibold">Revisão do cálculo</div>
              <div className="mb-[18px] text-[13px] text-muted">
                {negociacao.data.itensRecebivel.length + negociacao.data.itensEmprestimo.length} itens de{' '}
                {negociacao.data.cliente?.nome ?? (cliente ? nomeExibicaoCliente(cliente) : '')} — valores calculados
                pelo backend
              </div>

              <div className="mb-3.5 grid grid-cols-2 gap-3.5">
                <div className="rounded-panel border border-border bg-surface p-5">
                  <div className="text-xs text-muted">Valor bruto (desembolsado)</div>
                  <div className="tabnum mt-1.5 font-mono text-xl font-bold text-petroleo-tinta">
                    {formatarMoeda(negociacao.data.valorBruto)}
                  </div>
                </div>
                <div className="rounded-panel border border-border bg-surface p-5">
                  <div className="text-xs text-muted">Valor total a receber</div>
                  <div className="tabnum mt-1.5 font-mono text-xl font-bold">
                    {formatarMoeda(negociacao.data.valorTotalReceber)}
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-panel border border-border bg-surface p-[22px]">
                <LedgerCorner tone="neutral" />
                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                  <div>
                    <div className="text-[13.5px] font-medium">(–) Tarifas operacionais</div>
                    <div className="mt-0.5 text-[11.5px] text-muted">TAC + custódia, cobradas à parte</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] text-muted">R$</span>
                    <input
                      type="number"
                      step="1"
                      min={0}
                      value={tarifasInput}
                      onChange={(e) => setTarifasInput(parseFloat(e.target.value) || 0)}
                      onBlur={() => atualizarTarifas.mutate(tarifasInput)}
                      className="tabnum w-24 rounded-control border border-border px-2 py-1.5 text-right font-mono text-[13px]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-border-subtle py-4">
                  <div className="text-[13.5px] font-medium">Valor já pago (anterior à negociação)</div>
                  <div className="tabnum font-mono text-sm text-muted-foreground">
                    {formatarMoeda(negociacao.data.valorPago)}
                  </div>
                </div>
                <div className="pt-[18px]">
                  <div className="flex items-center justify-between">
                    <div className="text-[15px] font-bold">Valor a receber (saldo)</div>
                    <div className="tabnum font-mono text-[22px] font-bold text-ambar-atencao">
                      {formatarMoeda(negociacao.data.valorAReceber)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 overflow-hidden rounded-panel border border-border bg-surface">
                <div className="border-b border-border px-5 py-3.5 text-[13.5px] font-semibold">Itens incluídos</div>
                {montarItensDaTabela(negociacao.data).map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
                    <div>
                      <div className="text-[13px] font-semibold">{item.tipo}</div>
                      <div className="text-xs text-muted">{item.detalhe}</div>
                    </div>
                    <div className="tabnum font-mono text-[13px] font-semibold">{formatarMoeda(item.bruto)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && negociacao.data && (
            <div className="max-w-[620px]">
              <div className="mb-1 text-[15px] font-semibold">Confirmar negociação</div>
              <div className="mb-[18px] text-[13px] text-muted">
                Revise o resumo abaixo antes de enviar para aprovação. A negociação é criada em análise e segue para
                o status "Em andamento" (aprovada) — finalizar só fica disponível depois, quando o saldo a receber
                chegar a R$&nbsp;0,00.
              </div>
              <div className="rounded-panel border border-border bg-surface p-6">
                <div className="text-[15px] font-semibold">{negociacao.data.titulo || 'Negociação sem título'}</div>
                <div className="mt-0.5 text-[12.5px] text-muted">
                  {negociacao.data.cliente?.nome ?? ''} ·{' '}
                  {negociacao.data.itensRecebivel.length + negociacao.data.itensEmprestimo.length} itens
                </div>
                <div className="mt-[18px] grid grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <div className="text-[11.5px] text-muted">Valor bruto</div>
                    <div className="tabnum mt-0.5 font-mono text-sm font-semibold">
                      {formatarMoeda(negociacao.data.valorBruto)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11.5px] text-muted">Valor total a receber</div>
                    <div className="tabnum mt-0.5 font-mono text-sm font-semibold">
                      {formatarMoeda(negociacao.data.valorTotalReceber)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11.5px] text-muted">Tarifas</div>
                    <div className="tabnum mt-0.5 font-mono text-sm">– {formatarMoeda(negociacao.data.valorTarifas)}</div>
                  </div>
                  <div>
                    <div className="text-[11.5px] text-muted">Valor a receber (saldo)</div>
                    <div className="tabnum mt-0.5 font-mono text-[15px] font-bold text-ambar-atencao">
                      {formatarMoeda(negociacao.data.valorAReceber)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {erro && <div className="mt-5 text-xs text-vermelho-critico">{erro}</div>}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-surface px-10 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={cancelarWizard}
              className="text-[13px] font-medium text-muted underline-offset-2 hover:underline"
            >
              Cancelar
            </button>
            {step === 2 && (
              <div className="text-[13.5px] font-semibold">
                {totalItensSelecionados} itens selecionados · valor de face{' '}
                <span className="tabnum font-mono text-petroleo-tinta">{formatarMoeda(valorFaceSelecionado)}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2.5">
            {step > 1 && !negociacaoId && (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as typeof step) : s))}
                className="rounded-control border border-border bg-white px-[18px] py-2.5 text-[13.5px] font-medium"
              >
                Voltar
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                disabled={!numero || !titulo || !cliente}
                onClick={() => setStep(2)}
                className="rounded-control bg-petroleo-interativo px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
              >
                Continuar
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                disabled={totalItensSelecionados === 0 || criando}
                onClick={avancarDoPasso2}
                className="rounded-control bg-petroleo-interativo px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
              >
                {criando ? 'Criando negociação…' : 'Continuar'}
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-control bg-petroleo-interativo px-5 py-2.5 text-[13.5px] font-semibold text-white"
              >
                Continuar
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                disabled={aprovar.isPending}
                onClick={aprovarEConcluir}
                className="rounded-control bg-petroleo-interativo px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
              >
                {aprovar.isPending ? 'Aprovando…' : 'Aprovar negociação'}
              </button>
            )}
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className="flex h-[18px] w-[18px] items-center justify-center rounded border-[1.5px]"
      style={{ borderColor: checked ? '#1F6F72' : '#C7CDCC', background: checked ? '#1F6F72' : 'white' }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12l5 5L20 6" />
        </svg>
      )}
    </div>
  );
}

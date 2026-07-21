# NegociacaoDetalhePage — implementação a partir do Claude Design

Tradução 1:1 de `NegociacoesDetalhe.dc.html` (do export `Sistema_de_tokens_pronto_para_validação.zip`)
para React + Tailwind + TypeScript, já ligada ao contrato real do backend `factoring_api`
(não a dados mockados do arquivo `.dc.html`).

## O que tem aqui

```
tailwind.config.ts                                  # tokens extraídos de Tokens.dc.html
src/styles/globals.css                               # import das fontes (Public Sans, Space Grotesk, IBM Plex Mono)
src/components/shared/StatusBadge.tsx                 # tradução 1:1 de StatusBadge.dc.html + mapas enum→tom
src/components/shared/LedgerCorner.tsx                 # elemento de assinatura (canto diagonal de ledger)
src/components/layout/Sidebar.tsx                       # tradução de Sidebar.dc.html, ligada ao react-router + auth-store
src/stores/auth-store.ts                                 # store mínimo (zustand) usado pela Sidebar
src/lib/api-client.ts                                     # instância axios mínima (sem prefixo /api/v1)
src/types/negociacao.ts                                    # tipos alinhados ao schema.prisma real + montarItensDaTabela()
src/features/negociacoes/hooks/useNegociacao.ts              # React Query: GET /negociacoes/:id, PATCH .../finalizar
src/features/negociacoes/pages/NegociacaoDetalhePage.tsx       # a página em si
```

Isto é um recorte funcional, não o projeto inteiro — assume que `providers.tsx`
(`QueryClientProvider`), `routes.tsx` e o restante da estrutura descrita no
`prompt-frontend-factoring.md` já existem. Copie estes arquivos para dentro
dessa estrutura.

## Decisões tomadas ao traduzir o mockup

- **Tons dos badges de status**: o mockup mostra `StatusNegociacao.APROVADA` com tom `info` e
  rótulo "Em andamento" (é o texto usado no cabeçalho da tela). Mantive esse mapeamento em
  `STATUS_NEGOCIACAO_TONE` — ajuste o rótulo se "Em andamento" não for o texto que vocês querem
  para esse status em outras telas.
- **Ícones**: reproduzi os paths SVG exatos do `StatusBadge.dc.html` em vez de trocar por
  `lucide-react`, para manter fidelidade pixel-a-pixel com o mockup aprovado.
- **Cor da barra de progresso por item**: replica a lógica do mockup
  (`100% pago` → verde `#2F6D3B`, `0% < x < 100%` → petróleo interativo, `0%` → cinza `#C7CDCC`) —
  esses três tons não fazem parte da paleta nomeada em `Tokens.dc.html`, então ficaram como
  literais; considere nomeá-los se aparecerem em mais telas.
- **Botão "Finalizar negociação"**: habilitado quando `valorAReceber === 0` **e** o perfil logado
  é `ADMIN`/`OPERADOR` **e** o status atual é `APROVADA` (o backend só aceita finalizar a partir
  daí — confirme isso no Swagger se o fluxo mudar). O mockup só considera o saldo zerado; adicionei
  as outras duas condições porque vêm da tabela de RBAC e do fluxo de status auditados no backend.

## ⚠️ Lacuna encontrada no backend (bloqueia esta tela)

Auditando `negociacoes.service.ts`, o `include` usado em `findOne`/`findAll`
(`INCLUDE_ITENS`) traz `itensRecebivel.recebivel` e `itensEmprestimo.emprestimo.parcelas`
corretamente, **mas não inclui a relação `cliente`**:

```ts
const INCLUDE_ITENS = {
  itensRecebivel: { include: { recebivel: true } },
  itensEmprestimo: { include: { emprestimo: { include: { parcelas: true } } } },
} satisfies Prisma.NegociacaoInclude;
```

O mockup (e esta página) mostram o nome do cliente no cabeçalho
(`negociacao.cliente.nome`), mas `GET /negociacoes/:id` hoje devolve só `clienteId`, sem o objeto
`cliente`. É uma correção de uma linha no backend:

```diff
 const INCLUDE_ITENS = {
+  cliente: true,
   itensRecebivel: { include: { recebivel: true } },
   itensEmprestimo: { include: { emprestimo: { include: { parcelas: true } } } },
 } satisfies Prisma.NegociacaoInclude;
```

Peça esse ajuste antes de considerar esta tela pronta para testar de ponta a ponta — sem ele, o
nome do cliente no cabeçalho vem `undefined`.

## Como testar isoladamente

```bash
npm install axios @tanstack/react-query zustand react-router-dom
npm install -D tailwindcss
```

Envolva `<NegociacaoDetalhePage />` num `QueryClientProvider` + rota `/negociacoes/:id`, com
`VITE_API_URL` apontando para o backend rodando localmente.

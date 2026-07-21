/**
 * Elemento de assinatura do sistema (ver design/Tokens.dc.html): um pequeno
 * corte diagonal no canto superior direito de cards de KPI, cabeçalhos de
 * painel e passos do wizard. Sempre na cor do dado que carrega — petróleo em
 * estado neutro, âmbar em atenção, vermelho em crítico. Nunca um badge
 * arredondado ou borda lateral colorida.
 *
 * Uso: posicione o card pai com `relative overflow-hidden` e solte este
 * componente como primeiro filho.
 */

const TONE_COLOR = {
  neutral: '#123B3D',
  attention: '#9A5B13',
  critical: '#A8291F',
  // Petróleo interativo — usado em cards de KPI cujo dado é "operacional" (ex: empréstimos ativos).
  interactive: '#1F6F72',
  // Neutro base — corte claro sobre um card de fundo escuro (ex: card de destaque do Dashboard).
  inverted: '#F6F7F6',
} as const;

export type LedgerCornerTone = keyof typeof TONE_COLOR;

interface LedgerCornerProps {
  tone?: LedgerCornerTone;
  size?: number;
}

export function LedgerCorner({ tone = 'neutral', size = 22 }: LedgerCornerProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute right-0 top-0"
      style={{
        width: size,
        height: size,
        background: TONE_COLOR[tone],
        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
      }}
    />
  );
}

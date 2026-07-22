import type { SVGProps } from 'react';

/**
 * Traduzido 1:1 de design/StatusBadge.dc.html. Cinco tons semânticos, cada um
 * com cor de fundo/texto/borda e um ícone próprio — nunca depende só da cor
 * (requisito de acessibilidade do sistema de tokens).
 */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Exportado para que outras visualizações (ex: gráficos do Dashboard) usem a mesma cor do tom, em vez de duplicar hex. */
export const TONE_STYLES: Record<StatusTone, { bg: string; fg: string; border: string }> = {
  success: { bg: '#EAF3EA', fg: '#265E30', border: '#CFE3CF' },
  warning: { bg: '#FBF0DF', fg: '#8A5A15', border: '#F0DCB8' },
  danger: { bg: '#F8E7E5', fg: '#A8291F', border: '#EFCAC6' },
  info: { bg: '#E2EEEE', fg: '#1F6F72', border: '#C6DEDE' },
  neutral: { bg: '#EDEFEE', fg: '#4B5453', border: '#DDE2E1' },
};

function ToneIcon({ tone, ...props }: { tone: StatusTone } & SVGProps<SVGSVGElement>) {
  const shared = {
    width: 13,
    height: 13,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
  switch (tone) {
    case 'success':
      return (
        <svg {...shared}>
          <path d="M4 12l5 5L20 6" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v5" />
          <circle cx="12" cy="15.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'danger':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      );
    case 'info':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5.5" />
          <circle cx="12" cy="8" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'neutral':
    default:
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );
  }
}

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  const t = TONE_STYLES[tone];
  return (
    <div
      className={`inline-flex items-center gap-[5px] whitespace-nowrap rounded-[5px] py-[3px] pl-[7px] pr-[9px] text-xs font-semibold ${className ?? ''}`}
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.border}` }}
    >
      <span className="flex h-[13px] w-[13px] flex-shrink-0 items-center justify-center">
        <ToneIcon tone={tone} />
      </span>
      <span>{label}</span>
    </div>
  );
}

/**
 * Mapas enum -> tom, um por tipo de status do domínio. Centralizados aqui
 * para não reimplementar cor por feature. Ajuste os rótulos (`label`) se
 * preferir outro texto de exibição.
 *
 * Tons conferidos contra os exemplos de dados reais dos mockups (não
 * inventados): RecebiveisListagem.dc.html, ClientesDetalhe.dc.html,
 * EmprestimosDetalhe.dc.html e Dashboard.dc.html. `INADIMPLENTE` (Recebivel)
 * e `EM_ANALISE` (Negociacao) não aparecem em nenhum mockup — tom escolhido
 * por analogia semântica, ajuste se o design definir algo diferente.
 */
export const STATUS_RECEBIVEL_TONE: Record<string, { label: string; tone: StatusTone }> = {
  PENDENTE: { label: 'Pendente', tone: 'info' },
  NEGOCIADO: { label: 'Cedido', tone: 'neutral' },
  QUITADO: { label: 'Pago', tone: 'success' },
  VENCIDO: { label: 'Vencido', tone: 'danger' },
  INADIMPLENTE: { label: 'Inadimplente', tone: 'danger' },
};

export const STATUS_PARCELA_TONE: Record<string, { label: string; tone: StatusTone }> = {
  PENDENTE: { label: 'Pendente', tone: 'info' },
  PAGA: { label: 'Paga', tone: 'success' },
  ATRASADA: { label: 'Atrasada', tone: 'danger' },
};

export const STATUS_NEGOCIACAO_TONE: Record<string, { label: string; tone: StatusTone }> = {
  EM_ANALISE: { label: 'Em análise', tone: 'neutral' },
  APROVADA: { label: 'Em andamento', tone: 'info' },
  FINALIZADA: { label: 'Finalizada', tone: 'success' },
  CANCELADA: { label: 'Cancelada', tone: 'neutral' },
};

export const STATUS_CLIENTE_TONE: Record<string, { label: string; tone: StatusTone }> = {
  ATIVO: { label: 'Ativo', tone: 'success' },
  INATIVO: { label: 'Inativo', tone: 'neutral' },
};

/** Status do Empréstimo é derivado no frontend (ver statusDerivadoEmprestimo em types/emprestimo.ts) — não existe campo `status` no model. */
export const STATUS_EMPRESTIMO_TONE: Record<string, { label: string; tone: StatusTone }> = {
  ATIVO: { label: 'Ativo', tone: 'info' },
  QUITADO: { label: 'Quitado', tone: 'success' },
  EM_ATRASO: { label: 'Em atraso', tone: 'danger' },
};

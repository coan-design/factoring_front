import type { Config } from 'tailwindcss';

/**
 * Tokens extraídos de Tokens.dc.html (Sistema de Tokens — Factoring OS).
 * Fonte da verdade: o export do Claude Design. Não altere os hex aqui sem
 * atualizar o mockup de tokens correspondente.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta nomeada (ver Tokens.dc.html)
        'petroleo-tinta': '#123B3D', // marca, sidebar, texto de ênfase
        'petroleo-interativo': '#1F6F72', // botões, links, foco
        'ambar-atencao': '#9A5B13', // vencimento, pendência
        'vermelho-critico': '#A8291F', // erro, inadimplência, destrutivo
        'neutro-base': '#F6F7F6', // fundo de aplicação
        'grafite-texto': '#171C1C', // texto primário

        // Neutros de apoio usados nos mockups (bordas, texto secundário, hovers)
        border: {
          DEFAULT: '#E2E6E5',
          subtle: '#EEF0EF',
        },
        muted: {
          DEFAULT: '#6B7473',
          foreground: '#4B5453',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#FAFBFA',
        },

        // Tons semânticos do StatusBadge (bg / fg / border por tom)
        status: {
          success: { bg: '#EAF3EA', fg: '#265E30', border: '#CFE3CF' },
          warning: { bg: '#FBF0DF', fg: '#8A5A15', border: '#F0DCB8' },
          danger: { bg: '#F8E7E5', fg: '#A8291F', border: '#EFCAC6' },
          info: { bg: '#E2EEEE', fg: '#1F6F72', border: '#C6DEDE' },
          neutral: { bg: '#EDEFEE', fg: '#4B5453', border: '#DDE2E1' },
        },
      },
      fontFamily: {
        // Space Grotesk 600 — títulos de página, uso pontual (H1 de PageHeader)
        display: ['"Space Grotesk"', 'sans-serif'],
        // Public Sans 400/500/600 — toda a UI, labels, corpo, tabelas
        sans: ['"Public Sans"', 'sans-serif'],
        // IBM Plex Mono, tabular nums — valores monetários, taxas, datas em tabelas/KPIs
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        // 6px em inputs/botões (não pílula) · 10px em cards/painéis
        control: '6px',
        panel: '10px',
      },
      spacing: {
        // Grade base 4px — escala 4/8/12/16/24/32/48 já coberta pela escala padrão do Tailwind
      },
    },
  },
  plugins: [],
} satisfies Config;

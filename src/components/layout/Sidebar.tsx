import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';

/**
 * Traduzido de design/Sidebar.dc.html. No mockup o colapso é local (state do
 * componente); mantido assim aqui — não há necessidade de persistir entre
 * sessões a menos que o produto peça.
 */

interface NavItem {
  key: string;
  label: string;
  to: string;
  icon: ReactNode;
}

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </svg>
    ),
  },
  {
    key: 'recebiveis',
    label: 'Recebíveis',
    to: '/recebiveis',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="5" y="3" width="14" height="18" rx="1.5" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
      </svg>
    ),
  },
  {
    key: 'emprestimos',
    label: 'Empréstimos',
    to: '/emprestimos',
    icon: (
      <svg {...ICON_PROPS}>
        <ellipse cx="12" cy="7" rx="7" ry="3.2" />
        <path d="M5 7v10c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2V7" />
        <path d="M5 12c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2" />
      </svg>
    ),
  },
  {
    key: 'negociacoes',
    label: 'Negociações',
    to: '/negociacoes',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 8h11M11 4l4 4-4 4" />
        <path d="M20 16H9m4 4l-4-4 4-4" />
      </svg>
    ),
  },
];

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Sidebar() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  const width = expanded ? 236 : 72;
  const hpad = expanded ? 16 : 23;
  const userName = usuario?.nome ?? '';
  const userRole = usuario?.perfil ?? '';
  const isAdmin = usuario?.perfil === 'ADMIN';

  useEffect(() => {
    if (!settingsOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [settingsOpen]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-petroleo-tinta text-[#E7EEEC] transition-[width,min-width] duration-[180ms] ease-out"
      style={{ width, minWidth: width }}
    >
      <div className="flex h-6 items-center gap-2.5 py-5" style={{ paddingInline: hpad }}>
        <div className="relative h-[26px] w-[26px] flex-shrink-0 rounded-[3px] bg-[#E7EEEC]">
          <div
            className="absolute right-0 top-0 h-[9px] w-[9px] bg-petroleo-tinta"
            style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          />
        </div>
        {expanded && (
          <span className="whitespace-nowrap font-display text-[17px] font-semibold tracking-wide">
            CEDRO
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[7px] px-3 py-2.5 transition-colors ${
                isActive ? 'bg-petroleo-interativo text-white' : 'text-[#B9CBC9] hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center">
                  {item.icon}
                </span>
                {expanded && (
                  <span className={`whitespace-nowrap text-[13.5px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div ref={settingsRef} className="relative flex flex-col gap-3 border-t border-white/[0.14] p-3">
        {settingsOpen && (
          <div className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(18,59,61,0.24)]">
            <Link
              to="/meu-perfil"
              onClick={() => setSettingsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-3 text-[13px] font-medium text-grafite-texto no-underline hover:bg-neutro-base"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5453" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
              </svg>
              Meu perfil
            </Link>
            {isAdmin && (
              <>
                <div className="h-px bg-border-subtle" />
                <Link
                  to="/usuarios"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-3 text-[13px] font-medium text-grafite-texto no-underline hover:bg-neutro-base"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5453" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3.5 19c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
                    <path d="M16 8.2c1.2.3 2 1.4 2 2.6M18.5 19c0-2.4-1.5-4.5-3.5-5.5" />
                  </svg>
                  Gerenciar usuários
                </Link>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-petroleo-interativo text-xs font-semibold">
            {userName ? initialsOf(userName) : ''}
          </div>
          {expanded && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{userName}</div>
                <div className="mt-px text-[10.5px] font-semibold uppercase tracking-wide text-[#9FD1CE]">
                  {userRole}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen((s) => !s)}
                aria-label="Configurações"
                className={`flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[6px] transition-colors hover:bg-white/10 ${
                  settingsOpen ? 'text-white' : 'text-[#9FD1CE]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 010-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 010 4h-.09a1.7 1.7 0 00-1.55 1z" />
                </svg>
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 rounded-[7px] p-2 text-xs text-[#E7A6A0] transition-colors hover:bg-[#A8291F]/[0.16]"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          {expanded && <span>Sair do sistema</span>}
        </button>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-center gap-2 rounded-[7px] p-2 text-xs text-[#9FD1CE] transition-colors hover:bg-white/[0.08]"
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(-90deg)' }}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
          {expanded && <span>Recolher</span>}
        </button>
      </div>
    </div>
  );
}

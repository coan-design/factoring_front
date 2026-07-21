import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

/** Casco padrão de toda tela autenticada: sidebar fixa + conteúdo rolável. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-neutro-base font-sans text-grafite-texto">
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

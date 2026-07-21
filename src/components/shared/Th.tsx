import type { ReactNode } from 'react';

export function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`border-b border-border px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

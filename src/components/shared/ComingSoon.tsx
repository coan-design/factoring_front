import { AppShell } from '../layout/AppShell';

/** Placeholder temporário para telas ainda não traduzidas do mockup nesta sessão de trabalho. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <AppShell>
      <div className="flex h-full items-center justify-center text-sm text-muted">
        {title} — em construção
      </div>
    </AppShell>
  );
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

/** Rodapé de paginação padrão (ver design/ClientesListagem.dc.html) — reusado em toda listagem paginada. */
export function Pagination({ page, pageSize, total, itemLabel, onPageChange }: PaginationProps) {
  if (total === 0) return null;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
      <div className="text-[12.5px] text-muted">
        Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total} {itemLabel}
      </div>
      <div className="flex gap-1.5">
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ‹
        </PageButton>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <PageButton key={n} active={n === page} onClick={() => onPageChange(n)}>
            {n}
          </PageButton>
        ))}
        <PageButton disabled={page >= totalPaginas} onClick={() => onPageChange(page + 1)}>
          ›
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-[30px] w-[30px] rounded-control text-[12.5px] ${
        active
          ? 'border-none bg-petroleo-tinta text-white'
          : disabled
            ? 'border border-border bg-[#F1F1F0] text-[#B7BDBB]'
            : 'border border-border bg-white text-grafite-texto'
      }`}
    >
      {children}
    </button>
  );
}

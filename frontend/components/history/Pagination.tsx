interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-2.5 flex items-center justify-between">
      <p className="text-[10px] text-text-muted">
        Showing {start}–{end} of {totalItems} scans
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-md border border-hair border-border bg-card px-2 py-1 text-[10px] text-text-secondary disabled:opacity-40"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="rounded-md px-2.5 py-1 text-[10px]"
            style={{
              backgroundColor: page === currentPage ? "#111111" : "#ffffff",
              color: page === currentPage ? "#ffffff" : "#555555",
              border: page === currentPage ? "none" : "0.5px solid #eeeeee",
            }}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="rounded-md border border-hair border-border bg-card px-2 py-1 text-[10px] text-text-secondary disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}

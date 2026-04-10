export function CreateGroupPagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={[
          "inline-flex min-w-[88px] items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition",
          currentPage === 1
            ? "cursor-not-allowed border-black/8 bg-black/[0.03] text-black/28"
            : "border-black/10 bg-white text-black hover:bg-black/[0.03]",
        ].join(" ")}
      >
        上一頁
      </button>

      <div className="flex items-center gap-2">
        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition",
                isActive
                  ? "bg-black text-white"
                  : "border border-black/10 bg-white text-black/58 hover:text-black hover:bg-black/[0.03]",
              ].join(" ")}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={[
          "inline-flex min-w-[88px] items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition",
          currentPage === totalPages
            ? "cursor-not-allowed border-black/8 bg-black/[0.03] text-black/28"
            : "border-black/10 bg-white text-black hover:bg-black/[0.03]",
        ].join(" ")}
      >
        下一頁
      </button>
    </div>
  );
}

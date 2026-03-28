"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  count: number;
  pageSize?: number;
}

export default function Pagination({ count, pageSize = 20 }: PaginationProps) {
  const t = useTranslations("Search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(count / pageSize);

  if (count === 0 || totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, count);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
      <div className="text-sm text-text-muted">
        {t("showingResults", { start, end, total: count })}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background transition-colors text-sm font-medium"
        >
          {t("previous")}
        </button>
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-primary text-white"
                      : "border border-border hover:bg-background text-text"
                  }`}
                >
                  {page}
                </button>
              );
            } else if (
              page === currentPage - 2 ||
              page === currentPage + 2
            ) {
              return <span key={page} className="text-text-muted px-1">...</span>;
            }
            return null;
          })}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background transition-colors text-sm font-medium"
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
}

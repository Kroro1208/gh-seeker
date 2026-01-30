"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const t = useTranslations("pagination");
  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 ${className ?? ""}`}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
      >
        {t("previous")}
      </Button>
      {pageItems.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
      >
        {t("next")}
      </Button>
    </div>
  );
}

function buildPageItems(currentPage: number, totalPages: number) {
  // 表示できるページ数が少ない場合は省略せず全件表示
  if (totalPages <= 7) {
    // 1..totalPages の連番を作る
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  // 先頭・末尾・現在ページ周辺を候補として集める
  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  // 範囲外を除外して昇順に整える
  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  // 連続しない区間には "..." を挿入する
  return sortedPages.flatMap((page, i) => {
    // 直前のページを見て、間が空いていれば省略記号を追加
    const prev = sortedPages[i - 1];
    return prev && page - prev > 1 ? ["ellipsis" as const, page] : [page];
  });
}

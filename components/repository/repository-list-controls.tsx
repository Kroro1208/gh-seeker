"use client";

import { SearchRepositoriesParams } from "@/lib/github/types";
import { Pagination } from "./pagination";

type RepositoryListControlsProps = {
  pagination: {
    effectivePage: number;
    totalPages: number;
    effectiveTotalCount: number;
    displayedCount: number;
  };
  normalizedPerPage: number;
  normalizedSort: SearchRepositoriesParams["sort"] | "";
  language: string;
  languageOptions: string[];
  onPageChange: (nextPage: number) => void;
  onLanguageChange: (nextLanguage: string) => void;
  onSortChange: (nextSort: string) => void;
  onPerPageChange: (nextPerPage: string) => void;
};

export function RepositoryListControls({
  pagination,
  normalizedPerPage,
  normalizedSort,
  language,
  languageOptions,
  onPageChange,
  onLanguageChange,
  onSortChange,
  onPerPageChange,
}: RepositoryListControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.effectivePage}
            totalPages={pagination.totalPages}
            className="pt-0"
            onPageChange={onPageChange}
          />
        )}
        <p className="text-sm text-muted-foreground self-center">
          {pagination.displayedCount.toLocaleString()} 件表示 /{" "}
          {pagination.effectiveTotalCount.toLocaleString()} 件
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          言語
          <select
            name="language"
            className="h-9 w-36 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            aria-label="言語フィルター"
          >
            <option value="">すべて</option>
            {languageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          ソート
          <select
            name="sort"
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            value={normalizedSort}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="ソート"
          >
            <option value="">並び替え</option>
            <option value="stars">Star数（降順）</option>
            <option value="updated">更新日時（降順）</option>
            <option value="forks">フォーク数（降順）</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          表示件数
          <select
            name="per_page"
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            value={normalizedPerPage}
            onChange={(event) => onPerPageChange(event.target.value)}
            aria-label="1ページあたりの表示件数"
          >
            <option value="10">10件</option>
            <option value="30">30件</option>
            <option value="50">50件</option>
          </select>
        </label>
      </div>
    </div>
  );
}

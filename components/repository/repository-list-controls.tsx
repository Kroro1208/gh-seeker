"use client";

import { useTranslations } from "next-intl";
import { SearchRepositoriesParams } from "@/lib/github/types";
import { LanguageOption } from "@/lib/search/repository-search-logic";
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
  languageOptions: LanguageOption[];
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
  const tSearch = useTranslations("search");
  const tFilter = useTranslations("filter");
  const tSort = useTranslations("sort");
  const tPerPage = useTranslations("perPage");

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
          {tSearch("resultsCount", {
            displayed: pagination.displayedCount.toLocaleString(),
            total: pagination.effectiveTotalCount.toLocaleString(),
          })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {tFilter("language")}
          <select
            name="language"
            className="h-9 w-48 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            aria-label={tFilter("languageLabel")}
          >
            <option value="">{tFilter("allLanguages")}</option>
            {languageOptions.map((option) => (
              <option key={option.language} value={option.language}>
                {option.language} ({option.count.toLocaleString()})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {tSort("label")}
          <select
            name="sort"
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            value={normalizedSort}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label={tSort("label")}
          >
            <option value="">{tSort("bestMatch")}</option>
            <option value="stars">{tSort("stars")}</option>
            <option value="updated">{tSort("updated")}</option>
            <option value="forks">{tSort("forks")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {tPerPage("label")}
          <select
            name="per_page"
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            value={normalizedPerPage}
            onChange={(event) => onPerPageChange(event.target.value)}
            aria-label={tPerPage("ariaLabel")}
          >
            <option value="10">{tPerPage("items", { count: 10 })}</option>
            <option value="30">{tPerPage("items", { count: 30 })}</option>
            <option value="50">{tPerPage("items", { count: 50 })}</option>
          </select>
        </label>
      </div>
    </div>
  );
}

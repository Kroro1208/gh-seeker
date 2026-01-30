"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRepositorySearch } from "@/hooks/use-repository-search";
import { RepositoryCard } from "./repository-card";
import { Pagination } from "./pagination";
import { RepositoryListSkeleton } from "./repository-list-skeleton";
import { RepositoryListControls } from "./repository-list-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { getErrorPresentation } from "@/lib/github/errors";

export function RepositoryList() {
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const tError = useTranslations();
  const { state, handlers } = useRepositorySearch();

  const {
    query,
    paginatedItems,
    filteredItems,
    pagination,
    languageOptions,
    isLoading,
    isFetching,
    error,
    hasQuery,
    hasResults,
    normalizedSort,
    normalizedOrder,
    normalizedPerPage,
    language,
    resultsRef,
  } = state;

  // ページ変更時にトップへスクロール
  useEffect(() => {
    if (!hasQuery) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pagination.effectivePage, hasQuery]);

  // 検索結果にスクロール
  useEffect(() => {
    if (!hasQuery || isLoading || isFetching) return;
    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [hasQuery, isLoading, isFetching, resultsRef]);

  // クエリが空の場合
  if (!hasQuery) {
    return null;
  }

  // ローディング状態
  if (isLoading || (isFetching && !hasResults)) {
    return <RepositoryListSkeleton />;
  }

  // エラー状態
  if (error) {
    const errorInfo = getErrorPresentation(error);
    const title = tError(errorInfo.titleKey);
    const description = errorInfo.descriptionText
      ? errorInfo.descriptionText
      : errorInfo.descriptionKey
        ? tError(errorInfo.descriptionKey)
        : "";
    return (
      <div className="flex min-h-[20vh] w-full items-center justify-center px-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{description}</p>
            {errorInfo.canRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlers.refetch}
                className="mt-2"
              >
                {tCommon("retry")}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 検索結果が0件
  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("noResults")}</h3>
        <p className="text-muted-foreground">{t("noResultsHint")}</p>
      </div>
    );
  }

  // 検索結果を表示
  return (
    <div className="space-y-4 mt-10">
      <div ref={resultsRef} />
      <RepositoryListControls
        pagination={pagination}
        normalizedPerPage={normalizedPerPage}
        normalizedSort={normalizedSort}
        language={language}
        languageOptions={languageOptions}
        onPageChange={handlers.onPageChange}
        onLanguageChange={handlers.onLanguageChange}
        onSortChange={handlers.onSortChange}
        onPerPageChange={handlers.onPerPageChange}
      />
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("noFilterResults")}</h3>
          <p className="text-muted-foreground">{t("noFilterResultsHint")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedItems.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              searchQuery={query}
              language={language || undefined}
              sort={normalizedSort}
              order={normalizedOrder}
              page={pagination.effectivePage}
              perPage={normalizedPerPage}
            />
          ))}
        </div>
      )}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.effectivePage}
          totalPages={pagination.totalPages}
          onPageChange={handlers.onPageChange}
        />
      )}
    </div>
  );
}

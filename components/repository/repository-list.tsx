"use client";

import { useSearchRepositories } from "@/lib/github/use-search-repository";
import { searchRepositories } from "@/lib/github/client";
import { SearchRepositoriesParams } from "@/lib/github/types";
import { computePaginationMetrics } from "@/lib/search/pagination";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { RepositoryCard } from "./repository-card";
import { Pagination } from "./pagination";
import { RepositoryListSkeleton } from "./repository-list-skeleton";
import { RepositoryListControls } from "./repository-list-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { getErrorPresentation } from "@/lib/github/errors";

const SORT_OPTIONS = ["stars", "updated", "forks"] satisfies Array<
  SearchRepositoriesParams["sort"]
>;
const isSortOption = (
  value: string | undefined,
): value is SearchRepositoriesParams["sort"] =>
  SORT_OPTIONS.some((option) => option === value);

export function RepositoryList() {
  const queryClient = useQueryClient();
  const [query] = useQueryState("q", { defaultValue: "" });
  const [sort, setSort] = useQueryState("sort", { defaultValue: "" });
  const [, setOrder] = useQueryState("order", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [perPage, setPerPage] = useQueryState("per_page", {
    defaultValue: "30",
  });
  const [language, setLanguage] = useQueryState("language", {
    defaultValue: "",
  });

  const allowedPerPage = useMemo(() => new Set([10, 30, 50]), []);

  const normalizedSort = isSortOption(sort) ? sort : "";
  const normalizedOrder = normalizedSort ? "desc" : "";
  const parsedPage = Number.parseInt(page, 10);
  const normalizedPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPerPage = Number.parseInt(perPage, 10);
  const normalizedPerPage = allowedPerPage.has(parsedPerPage)
    ? parsedPerPage
    : 30;
  const apiPerPage = 100;
  const maxSearchResults = 1000;
  const basePagination = computePaginationMetrics({
    page: normalizedPage,
    perPage: normalizedPerPage,
    totalCount: maxSearchResults,
    filteredCount: 0,
    isFiltered: false,
    apiPerPage,
    maxSearchResults,
  });

  const resultsRef = useRef<HTMLDivElement | null>(null);

  // ページ変更時にトップへスクロール
  useEffect(() => {
    if (!query || query.trim() === "") {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [normalizedPage, query]);

  const currentParams: SearchRepositoriesParams = {
    q: query,
    sort: normalizedSort || undefined,
    order: normalizedOrder || undefined,
    page: basePagination.apiPage,
    per_page: apiPerPage,
  };

  const { data, isLoading, isFetching, error, refetch } =
    useSearchRepositories(currentParams);

  // クエリが空の場合
  const trimmedQuery = query.trim();
  const trimmedLanguage = language.trim();
  const isLanguageFilterActive = trimmedLanguage !== "";

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    const sortOptions: Array<SearchRepositoriesParams["sort"]> = [
      "stars",
      "updated",
      "forks",
    ];

    // 他のソートオプションは事前にフェッチしておく
    for (const sortOption of sortOptions) {
      if (sortOption === normalizedSort) continue;

      const params: SearchRepositoriesParams = {
        q: query,
        sort: sortOption,
        order: "desc",
        page: basePagination.apiPage,
        per_page: apiPerPage,
      };

      // ここで事前フェッチ
      queryClient.prefetchQuery({
        queryKey: ["repositories", "search", params],
        queryFn: () => searchRepositories(params),
      });
    }
  }, [
    apiPerPage,
    basePagination.apiPage,
    normalizedSort,
    query,
    queryClient,
    trimmedQuery,
  ]);

  const languageOptions = data?.items
    ? [
        ...new Set(
          data.items
            .map((repo) => repo.language)
            .filter((lang): lang is string => lang != null),
        ),
      ].sort((a, b) => a.localeCompare(b))
    : [];

  const filteredItems =
    data?.items.filter((repo) => {
      if (!trimmedLanguage) {
        return true;
      }
      return repo.language?.toLowerCase() === trimmedLanguage.toLowerCase();
    }) ?? [];

  const totalCount = data?.total_count ?? 0;
  const pagination = computePaginationMetrics({
    page: normalizedPage,
    perPage: normalizedPerPage,
    totalCount,
    filteredCount: filteredItems.length,
    isFiltered: isLanguageFilterActive,
    apiPerPage,
    maxSearchResults,
  });
  const paginatedItems = filteredItems.slice(
    pagination.pageSliceStart,
    pagination.pageSliceEnd,
  );

  // 検索結果にスクロール
  useEffect(() => {
    if (!trimmedQuery || !data || isFetching) {
      return;
    }

    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [data, isFetching, trimmedQuery]);

  if (!trimmedQuery) {
    return;
  }

  // ローディング状態
  if (isLoading || (isFetching && !data)) {
    return <RepositoryListSkeleton />;
  }

  // エラー状態
  if (error) {
    const { title, description, canRetry } = getErrorPresentation(error);

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{description}</p>
          {canRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              再試行
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  // 検索結果が0件
  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          該当するリポジトリが見つかりませんでした
        </h3>
        <p className="text-muted-foreground">
          別のキーワードで検索してみてください
        </p>
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
        onPageChange={(nextPage) => setPage(nextPage.toString())}
        onLanguageChange={(nextLanguage) => {
          setLanguage(nextLanguage || null);
          setPage("1");
        }}
        onSortChange={(nextSort) => {
          setSort(nextSort || null);
          setOrder(nextSort ? "desc" : null);
          setPage("1");
        }}
        onPerPageChange={(nextValue) => {
          setPerPage(nextValue);
          setPage("1");
        }}
      />
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            該当するリポジトリが見つかりませんでした
          </h3>
          <p className="text-muted-foreground">
            言語フィルターを変更してみてください
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedItems.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              searchQuery={query}
              language={trimmedLanguage || undefined}
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
          onPageChange={(nextPage) => setPage(nextPage.toString())}
        />
      )}
    </div>
  );
}

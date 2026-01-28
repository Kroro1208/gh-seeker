"use client";

import { useMemo, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { useSearchRepositories } from "@/lib/github/use-search-repository";
import { searchRepositories } from "@/lib/github/client";
import { SearchRepositoriesParams, Repository } from "@/lib/github/types";
import {
  API_PER_PAGE,
  SORT_OPTIONS,
  buildSearchRepositoriesParams,
  computeBasePaginationMetrics,
  deriveRepositorySearchState,
  normalizeRepositorySearchInput,
} from "@/lib/search/repository-search-logic";
import { PaginationMetrics } from "@/lib/search/pagination";

export type RepositorySearchState = {
  query: string;
  paginatedItems: Repository[];
  filteredItems: Repository[];
  pagination: PaginationMetrics;
  languageOptions: string[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  hasQuery: boolean;
  hasResults: boolean;
  isLanguageFilterActive: boolean;
  normalizedSort: SearchRepositoriesParams["sort"];
  normalizedOrder: SearchRepositoriesParams["order"];
  normalizedPerPage: number;
  language: string;
  resultsRef: React.RefObject<HTMLDivElement | null>;
};

export type RepositorySearchHandlers = {
  onPageChange: (page: number) => void;
  onLanguageChange: (language: string | null) => void;
  onSortChange: (sort: string | null) => void;
  onPerPageChange: (perPage: string) => void;
  refetch: () => void;
};

type UseRepositorySearchResult = {
  state: RepositorySearchState;
  handlers: RepositorySearchHandlers;
};

// リポジトリ検索のロジックを管理するカスタムフック
// UIコンポーネントから状態管理ロジックを分離
export function useRepositorySearch(): UseRepositorySearchResult {
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

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const {
    normalizedSort,
    normalizedOrder,
    normalizedPage,
    normalizedPerPage,
    trimmedQuery,
    trimmedLanguage,
    isLanguageFilterActive,
    hasQuery,
  } = useMemo(
    () =>
      normalizeRepositorySearchInput({
        query,
        sort,
        page,
        perPage,
        language,
      }),
    [query, sort, page, perPage, language],
  );

  // ベースのページネーション計算
  const basePagination = useMemo(
    () =>
      computeBasePaginationMetrics({
        normalizedPage,
        normalizedPerPage,
      }),
    [normalizedPage, normalizedPerPage],
  );

  // 検索パラメータ
  const currentParams: SearchRepositoriesParams = useMemo(
    () => ({
      ...buildSearchRepositoriesParams({
        query,
        normalizedSort,
        normalizedOrder,
        apiPage: basePagination.apiPage,
      }),
    }),
    [query, normalizedSort, normalizedOrder, basePagination.apiPage],
  );

  const { data, isLoading, isFetching, error, refetch } =
    useSearchRepositories(currentParams);

  // 事前フェッチしてSortオプション切り替え時のUXを向上させる
  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    for (const sortOption of SORT_OPTIONS) {
      if (sortOption === normalizedSort) continue;

      const params: SearchRepositoriesParams = {
        q: query,
        sort: sortOption,
        order: "desc",
        page: basePagination.apiPage,
        per_page: API_PER_PAGE,
      };

      queryClient.prefetchQuery({
        queryKey: ["repositories", "search", params],
        queryFn: () => searchRepositories(params),
      });
    }
  }, [
    basePagination.apiPage,
    normalizedSort,
    query,
    queryClient,
    trimmedQuery,
  ]);

  const {
    languageOptions,
    filteredItems,
    pagination,
    paginatedItems,
    hasResults,
  } = useMemo(
    () =>
      deriveRepositorySearchState({
        data,
        normalizedPage,
        normalizedPerPage,
        trimmedLanguage,
        isLanguageFilterActive,
      }),
    [
      data,
      normalizedPage,
      normalizedPerPage,
      trimmedLanguage,
      isLanguageFilterActive,
    ],
  );

  // ハンドラー
  const handlers: RepositorySearchHandlers = useMemo(
    () => ({
      onPageChange: (nextPage: number) => setPage(nextPage.toString()),
      onLanguageChange: (nextLanguage: string | null) => {
        setLanguage(nextLanguage);
        setPage("1");
      },
      onSortChange: (nextSort: string | null) => {
        setSort(nextSort);
        setOrder(nextSort ? "desc" : null);
        setPage("1");
      },
      onPerPageChange: (nextValue: string) => {
        setPerPage(nextValue);
        setPage("1");
      },
      refetch,
    }),
    [setPage, setLanguage, setSort, setOrder, setPerPage, refetch],
  );

  return {
    state: {
      query,
      paginatedItems,
      filteredItems,
      pagination,
      languageOptions,
      isLoading,
      isFetching,
      error: error as Error | null,
      hasQuery,
      hasResults,
      isLanguageFilterActive,
      normalizedSort,
      normalizedOrder,
      normalizedPerPage,
      language: trimmedLanguage,
      resultsRef,
    },
    handlers,
  };
}

"use client";

import { useMemo, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { useSearchRepositories } from "@/lib/github/use-search-repository";
import { searchRepositories } from "@/lib/github/client";
import { SearchRepositoriesParams, Repository } from "@/lib/github/types";
import {
  computePaginationMetrics,
  PaginationMetrics,
} from "@/lib/search/pagination";

const SORT_OPTIONS = ["stars", "updated", "forks"] satisfies Array<
  SearchRepositoriesParams["sort"]
>;

function isSortOption(
  value: string | undefined,
): value is SearchRepositoriesParams["sort"] {
  return SORT_OPTIONS.some((option) => option === value);
}

const API_PER_PAGE = 100;
const MAX_SEARCH_RESULTS = 1000;
const ALLOWED_PER_PAGE = new Set([10, 30, 50]);

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
  normalizedOrder: string;
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

export type UseRepositorySearchResult = {
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

  // 正規化された値を計算
  const normalizedSort = isSortOption(sort) ? sort : undefined;
  const normalizedOrder = normalizedSort ? "desc" : "";
  const parsedPage = Number.parseInt(page, 10);
  const normalizedPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPerPage = Number.parseInt(perPage, 10);
  const normalizedPerPage = ALLOWED_PER_PAGE.has(parsedPerPage)
    ? parsedPerPage
    : 30;

  const trimmedQuery = query.trim();
  const trimmedLanguage = language.trim();
  const isLanguageFilterActive = trimmedLanguage !== "";

  // ベースのページネーション計算
  const basePagination = useMemo(
    () =>
      computePaginationMetrics({
        page: normalizedPage,
        perPage: normalizedPerPage,
        totalCount: MAX_SEARCH_RESULTS,
        filteredCount: 0,
        isFiltered: false,
        apiPerPage: API_PER_PAGE,
        maxSearchResults: MAX_SEARCH_RESULTS,
      }),
    [normalizedPage, normalizedPerPage],
  );

  // 検索パラメータ
  const currentParams: SearchRepositoriesParams = useMemo(
    () => ({
      q: query,
      sort: normalizedSort || undefined,
      order: normalizedOrder || undefined,
      page: basePagination.apiPage,
      per_page: API_PER_PAGE,
    }),
    [query, normalizedSort, normalizedOrder, basePagination.apiPage],
  );

  const { data, isLoading, isFetching, error, refetch } =
    useSearchRepositories(currentParams);

  // 事前フェッチ
  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    const sortOptions: Array<SearchRepositoriesParams["sort"]> = [
      "stars",
      "updated",
      "forks",
    ];

    for (const sortOption of sortOptions) {
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

  // 言語オプションを抽出
  const languageOptions = useMemo(() => {
    if (!data?.items) return [];
    return [
      ...new Set(
        data.items
          .map((repo) => repo.language)
          .filter((lang): lang is string => lang != null),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [data]);

  // フィルタリングされたアイテム
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!trimmedLanguage) return data.items;
    return data.items.filter(
      (repo) => repo.language?.toLowerCase() === trimmedLanguage.toLowerCase(),
    );
  }, [data, trimmedLanguage]);

  // ページネーション計算
  const pagination = useMemo(() => {
    const totalCount = data?.total_count ?? 0;
    return computePaginationMetrics({
      page: normalizedPage,
      perPage: normalizedPerPage,
      totalCount,
      filteredCount: filteredItems.length,
      isFiltered: isLanguageFilterActive,
      apiPerPage: API_PER_PAGE,
      maxSearchResults: MAX_SEARCH_RESULTS,
    });
  }, [
    data?.total_count,
    normalizedPage,
    normalizedPerPage,
    filteredItems.length,
    isLanguageFilterActive,
  ]);

  // ページネートされたアイテム
  const paginatedItems = useMemo(
    () =>
      filteredItems.slice(pagination.pageSliceStart, pagination.pageSliceEnd),
    [filteredItems, pagination.pageSliceStart, pagination.pageSliceEnd],
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
      hasQuery: Boolean(trimmedQuery),
      hasResults: Boolean(data && data.items.length > 0),
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

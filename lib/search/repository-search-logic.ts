import {
  Repository,
  SearchRepositoriesParams,
  SearchRepositoriesResponse,
} from "@/lib/github/types";
import {
  computePaginationMetrics,
  PaginationMetrics,
} from "@/lib/search/pagination";

export const SORT_OPTIONS = ["stars", "updated", "forks"] satisfies Array<
  SearchRepositoriesParams["sort"]
>;

export const API_PER_PAGE = 100;
export const MAX_SEARCH_RESULTS = 1000;
export const ALLOWED_PER_PAGE = new Set([10, 30, 50]);

export type NormalizedSearchInput = {
  normalizedSort: SearchRepositoriesParams["sort"] | undefined;
  normalizedOrder: SearchRepositoriesParams["order"] | undefined;
  normalizedPage: number;
  normalizedPerPage: number;
  trimmedQuery: string;
  trimmedLanguage: string;
  isLanguageFilterActive: boolean;
  hasQuery: boolean;
};

export type RepositorySearchDerivedState = {
  languageOptions: LanguageOption[];
  filteredItems: Repository[];
  pagination: PaginationMetrics;
  paginatedItems: Repository[];
  hasResults: boolean;
};

export type LanguageOption = {
  language: string;
  count: number;
};

// sortオプションかどうかを判定する型ガード
export function isSortOption(
  value: string | undefined,
): value is SearchRepositoriesParams["sort"] {
  return SORT_OPTIONS.some((option) => option === value);
}

export function normalizeRepositorySearchInput({
  query,
  sort,
  page,
  perPage,
  language,
}: {
  query: string;
  sort: string;
  page: string;
  perPage: string;
  language: string;
}): NormalizedSearchInput {
  const normalizedSort = isSortOption(sort) ? sort : undefined;
  const normalizedOrder = normalizedSort ? "desc" : undefined;
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

  return {
    normalizedSort,
    normalizedOrder,
    normalizedPage,
    normalizedPerPage,
    trimmedQuery,
    trimmedLanguage,
    isLanguageFilterActive,
    hasQuery: Boolean(trimmedQuery),
  };
}

export function computeBasePaginationMetrics({
  normalizedPage,
  normalizedPerPage,
}: {
  normalizedPage: number;
  normalizedPerPage: number;
}): PaginationMetrics {
  return computePaginationMetrics({
    page: normalizedPage,
    perPage: normalizedPerPage,
    totalCount: MAX_SEARCH_RESULTS,
    filteredCount: 0,
    isFiltered: false,
    apiPerPage: API_PER_PAGE,
    maxSearchResults: MAX_SEARCH_RESULTS,
  });
}

export function buildSearchRepositoriesParams({
  query,
  normalizedSort,
  normalizedOrder,
  apiPage,
}: {
  query: string;
  normalizedSort: SearchRepositoriesParams["sort"] | undefined;
  normalizedOrder: SearchRepositoriesParams["order"] | "";
  apiPage: number;
}): SearchRepositoriesParams {
  return {
    q: query,
    sort: normalizedSort || undefined,
    order: normalizedOrder || undefined,
    page: apiPage,
    per_page: API_PER_PAGE,
  };
}

export function getLanguageOptions(
  items: Repository[] | undefined,
): LanguageOption[] {
  if (!items) return [];
  const counts = new Map<string, number>();

  // 言語ごとの出現回数をカウントしてMapに格納
  for (const repo of items) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => a.language.localeCompare(b.language));
}

export function filterRepositoriesByLanguage(
  items: Repository[] | undefined,
  language: string,
): Repository[] {
  if (!items) return [];
  if (!language) return items;
  const target = language.toLowerCase();
  return items.filter((repo) => repo.language?.toLowerCase() === target);
}

export function computeRepositoryPagination({
  totalCount,
  normalizedPage,
  normalizedPerPage,
  filteredCount,
  isLanguageFilterActive,
}: {
  totalCount: number;
  normalizedPage: number;
  normalizedPerPage: number;
  filteredCount: number;
  isLanguageFilterActive: boolean;
}): PaginationMetrics {
  return computePaginationMetrics({
    page: normalizedPage,
    perPage: normalizedPerPage,
    totalCount,
    filteredCount,
    isFiltered: isLanguageFilterActive,
    apiPerPage: API_PER_PAGE,
    maxSearchResults: MAX_SEARCH_RESULTS,
  });
}

export function paginateRepositories(
  items: Repository[],
  pagination: PaginationMetrics,
): Repository[] {
  return items.slice(pagination.pageSliceStart, pagination.pageSliceEnd);
}

export function deriveRepositorySearchState({
  data,
  normalizedPage,
  normalizedPerPage,
  trimmedLanguage,
  isLanguageFilterActive,
}: {
  data: SearchRepositoriesResponse | undefined;
  normalizedPage: number;
  normalizedPerPage: number;
  trimmedLanguage: string;
  isLanguageFilterActive: boolean;
}): RepositorySearchDerivedState {
  const items = data?.items ?? [];
  const languageOptions = getLanguageOptions(items);
  const filteredItems = filterRepositoriesByLanguage(items, trimmedLanguage);
  const pagination = computeRepositoryPagination({
    totalCount: data?.total_count ?? 0,
    normalizedPage,
    normalizedPerPage,
    filteredCount: filteredItems.length,
    isLanguageFilterActive,
  });
  const paginatedItems = paginateRepositories(filteredItems, pagination);

  return {
    languageOptions,
    filteredItems,
    pagination,
    paginatedItems,
    hasResults: Boolean(data && data.items.length > 0),
  };
}

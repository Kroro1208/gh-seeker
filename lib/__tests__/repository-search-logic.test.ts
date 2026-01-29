import { describe, it, expect } from "vitest";
import type { Repository, SearchRepositoriesResponse } from "../github/types";
import {
  API_PER_PAGE,
  MAX_SEARCH_RESULTS,
  SORT_OPTIONS,
  buildSearchRepositoriesParams,
  computeBasePaginationMetrics,
  computeRepositoryPagination,
  deriveRepositorySearchState,
  filterRepositoriesByLanguage,
  getLanguageOptions,
  isSortOption,
  normalizeRepositorySearchInput,
  paginateRepositories,
} from "../search/repository-search-logic";

const createRepository = (overrides: Partial<Repository> = {}): Repository => ({
  id: 1,
  name: "repo",
  full_name: "user/repo",
  description: "desc",
  html_url: "https://github.com/user/repo",
  stargazers_count: 10,
  watchers_count: 5,
  forks_count: 2,
  open_issues_count: 1,
  language: "TypeScript",
  owner: {
    id: 1,
    login: "user",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    html_url: "https://github.com/user",
    type: "User",
  },
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  pushed_at: "2024-01-15T00:00:00Z",
  license: null,
  ...overrides,
});

const createSearchResponse = (
  items: Repository[],
  totalCount = items.length,
): SearchRepositoriesResponse => ({
  total_count: totalCount,
  incomplete_results: false,
  items,
});

describe("repository-search-logic", () => {
  describe("isSortOption", () => {
    it("許可されているソートをtrueで判定する", () => {
      for (const option of SORT_OPTIONS) {
        expect(isSortOption(option)).toBe(true);
      }
    });

    it("許可されていないソートはfalseになる", () => {
      expect(isSortOption("relevance")).toBe(false);
      expect(isSortOption(undefined)).toBe(false);
    });
  });

  describe("normalizeRepositorySearchInput", () => {
    it("入力値を正規化する", () => {
      const result = normalizeRepositorySearchInput({
        query: "  react  ",
        sort: "stars",
        page: "2",
        perPage: "50",
        language: "  TypeScript ",
      });

      expect(result.normalizedSort).toBe("stars");
      expect(result.normalizedOrder).toBe("desc");
      expect(result.normalizedPage).toBe(2);
      expect(result.normalizedPerPage).toBe(50);
      expect(result.trimmedQuery).toBe("react");
      expect(result.trimmedLanguage).toBe("TypeScript");
      expect(result.isLanguageFilterActive).toBe(true);
      expect(result.hasQuery).toBe(true);
    });

    it("無効な値はデフォルトに戻す", () => {
      const result = normalizeRepositorySearchInput({
        query: "   ",
        sort: "invalid",
        page: "0",
        perPage: "999",
        language: "  ",
      });

      expect(result.normalizedSort).toBeUndefined();
      expect(result.normalizedOrder).toBeUndefined();
      expect(result.normalizedPage).toBe(1);
      expect(result.normalizedPerPage).toBe(30);
      expect(result.hasQuery).toBe(false);
      expect(result.isLanguageFilterActive).toBe(false);
    });
  });

  describe("computeBasePaginationMetrics", () => {
    it("検索最大件数をベースにページネーションを計算する", () => {
      const result = computeBasePaginationMetrics({
        normalizedPage: 1,
        normalizedPerPage: 30,
      });

      expect(result.totalPages).toBe(Math.ceil(MAX_SEARCH_RESULTS / 30));
      expect(result.effectiveTotalCount).toBe(MAX_SEARCH_RESULTS);
      expect(result.apiPage).toBe(1);
      expect(result.pageSliceStart).toBe(0);
      expect(result.pageSliceEnd).toBe(30);
    });
  });

  describe("buildSearchRepositoriesParams", () => {
    it("APIパラメータを組み立てる", () => {
      const params = buildSearchRepositoriesParams({
        query: "react",
        normalizedSort: "stars",
        normalizedOrder: "desc",
        apiPage: 2,
      });

      expect(params).toEqual({
        q: "react",
        sort: "stars",
        order: "desc",
        page: 2,
        per_page: API_PER_PAGE,
      });
    });

    it("sort/orderが未指定ならundefinedになる", () => {
      const params = buildSearchRepositoriesParams({
        query: "react",
        normalizedSort: undefined,
        normalizedOrder: "",
        apiPage: 1,
      });

      expect(params.sort).toBeUndefined();
      expect(params.order).toBeUndefined();
    });
  });

  describe("getLanguageOptions", () => {
    it("言語ごとの件数を集計してソートする", () => {
      const items = [
        createRepository({ language: "TypeScript" }),
        createRepository({ id: 2, language: "JavaScript" }),
        createRepository({ id: 3, language: "TypeScript" }),
        createRepository({ id: 4, language: null }),
      ];

      const result = getLanguageOptions(items);

      expect(result).toEqual([
        { language: "JavaScript", count: 1 },
        { language: "TypeScript", count: 2 },
      ]);
    });

    it("itemsが未定義なら空配列", () => {
      expect(getLanguageOptions(undefined)).toEqual([]);
    });
  });

  describe("filterRepositoriesByLanguage", () => {
    it("言語未指定なら元の配列を返す", () => {
      const items = [createRepository()];
      expect(filterRepositoriesByLanguage(items, "")).toEqual(items);
    });

    it("言語指定時は大文字小文字を無視してフィルタする", () => {
      const items = [
        createRepository({ language: "TypeScript" }),
        createRepository({ id: 2, language: "JavaScript" }),
      ];

      const result = filterRepositoriesByLanguage(items, "typescript");

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe("TypeScript");
    });

    it("itemsが未定義なら空配列", () => {
      expect(filterRepositoriesByLanguage(undefined, "TypeScript")).toEqual([]);
    });
  });

  describe("computeRepositoryPagination", () => {
    it("言語フィルタ有効時はfilteredCountで計算する", () => {
      const result = computeRepositoryPagination({
        totalCount: 100,
        normalizedPage: 1,
        normalizedPerPage: 30,
        filteredCount: 0,
        isLanguageFilterActive: true,
      });

      expect(result.effectiveTotalCount).toBe(0);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("paginateRepositories", () => {
    it("ページスライスに従って配列を切り出す", () => {
      const items = [
        createRepository({ id: 1 }),
        createRepository({ id: 2 }),
        createRepository({ id: 3 }),
        createRepository({ id: 4 }),
      ];

      const pagination = {
        effectivePage: 1,
        totalPages: 1,
        effectiveTotalCount: items.length,
        displayedCount: items.length,
        apiPage: 1,
        pageSliceStart: 1,
        pageSliceEnd: 3,
      } as const;

      const result = paginateRepositories(items, pagination);

      expect(result.map((repo) => repo.id)).toEqual([2, 3]);
    });
  });

  describe("deriveRepositorySearchState", () => {
    it("データがない場合は空の派生状態を返す", () => {
      const result = deriveRepositorySearchState({
        data: undefined,
        normalizedPage: 1,
        normalizedPerPage: 30,
        trimmedLanguage: "",
        isLanguageFilterActive: false,
      });

      expect(result.languageOptions).toEqual([]);
      expect(result.filteredItems).toEqual([]);
      expect(result.paginatedItems).toEqual([]);
      expect(result.hasResults).toBe(false);
    });

    it("言語フィルターとページネーションを反映する", () => {
      const items = [
        createRepository({ id: 1, language: "TypeScript" }),
        createRepository({ id: 2, language: "JavaScript" }),
      ];

      const result = deriveRepositorySearchState({
        data: createSearchResponse(items, 2),
        normalizedPage: 1,
        normalizedPerPage: 30,
        trimmedLanguage: "TypeScript",
        isLanguageFilterActive: true,
      });

      expect(result.filteredItems).toHaveLength(1);
      expect(result.paginatedItems).toHaveLength(1);
      expect(result.languageOptions).toEqual([
        { language: "JavaScript", count: 1 },
        { language: "TypeScript", count: 1 },
      ]);
      expect(result.hasResults).toBe(true);
    });
  });
});

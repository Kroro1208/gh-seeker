import { describe, it, expect } from "vitest";
import { computePaginationMetrics } from "../search/pagination";

describe("computePaginationMetrics", () => {
  const defaultParams = {
    page: 1,
    perPage: 30,
    totalCount: 100,
    filteredCount: 100,
    isFiltered: false,
    apiPerPage: 100,
    maxSearchResults: 1000,
  };

  describe("基本的なページネーション計算", () => {
    it("1ページ目の基本的なメトリクスを計算する", () => {
      // Arrange
      const params = { ...defaultParams };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.effectivePage).toBe(1);
      expect(result.totalPages).toBe(4); // 100 / 30 = 3.33 -> 4
      expect(result.effectiveTotalCount).toBe(100);
      expect(result.displayedCount).toBe(30);
      expect(result.apiPage).toBe(1);
      expect(result.pageSliceStart).toBe(0);
      expect(result.pageSliceEnd).toBe(30);
    });

    it("2ページ目のメトリクスを計算する", () => {
      // Arrange
      const params = { ...defaultParams, page: 2 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.effectivePage).toBe(2);
      expect(result.displayedCount).toBe(60); // 2 * 30
      expect(result.pageSliceStart).toBe(30);
      expect(result.pageSliceEnd).toBe(60);
    });

    it("最終ページのメトリクスを計算する", () => {
      // Arrange
      const params = { ...defaultParams, page: 4 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.effectivePage).toBe(4);
      expect(result.displayedCount).toBe(100); // min(4 * 30, 100)
    });
  });

  describe("ページ番号の正規化", () => {
    it("0以下のページ番号は1に正規化される", () => {
      // Arrange
      const params = { ...defaultParams, page: 0 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.effectivePage).toBe(1);
    });

    it("負のページ番号は1に正規化される", () => {
      // Arrange
      const params = { ...defaultParams, page: -5 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.effectivePage).toBe(1);
    });

    it("最大ページを超えるページ番号は最大ページに正規化される", () => {
      // Arrange
      // maxPage は maxSearchResults / perPage で計算される（totalCountではない）
      // maxSearchResults = 1000, perPage = 30 -> maxPage = 34
      const params = { ...defaultParams, page: 100, totalCount: 50 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      // maxPage = ceil(1000 / 30) = 34 なので、100は34に正規化される
      expect(result.effectivePage).toBe(34);
      // ただしtotalPagesは実際のデータ数から計算される
      expect(result.totalPages).toBe(2); // 50 / 30 = 1.67 -> 2
    });
  });

  describe("GitHub API制限の考慮", () => {
    it("totalCountがmaxSearchResultsで制限される", () => {
      // Arrange
      const params = { ...defaultParams, totalCount: 5000 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.effectiveTotalCount).toBe(1000); // maxSearchResults
      expect(result.totalPages).toBe(34); // 1000 / 30 = 33.33 -> 34
    });

    it("100件を超えた場合のAPIページ計算", () => {
      // Arrange
      const params = { ...defaultParams, page: 4, totalCount: 500 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      // page 4: offset = (4-1) * 30 = 90
      // apiPage = floor(90 / 100) + 1 = 1
      expect(result.apiPage).toBe(1);
      expect(result.pageSliceStart).toBe(90);
      expect(result.pageSliceEnd).toBe(120);
    });

    it("2番目のAPIページに跨る場合の計算", () => {
      // Arrange
      const params = { ...defaultParams, page: 5, totalCount: 500 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      // page 5: offset = (5-1) * 30 = 120
      // apiPage = floor(120 / 100) + 1 = 2
      expect(result.apiPage).toBe(2);
      expect(result.pageSliceStart).toBe(20); // 120 % 100
      expect(result.pageSliceEnd).toBe(50); // 20 + 30
    });
  });

  describe("フィルタリング時の計算", () => {
    it("フィルタリング時はfilteredCountを使用する", () => {
      // Arrange
      const params = {
        ...defaultParams,
        isFiltered: true,
        totalCount: 500,
        filteredCount: 25,
      };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.effectiveTotalCount).toBe(25);
      expect(result.totalPages).toBe(1); // 25 / 30 = 0.83 -> 1
    });

    it("フィルタリング時はapiPerPageで制限される", () => {
      // Arrange
      const params = {
        ...defaultParams,
        isFiltered: true,
        totalCount: 500,
        filteredCount: 150,
        apiPerPage: 100,
      };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.effectiveTotalCount).toBe(100); // min(150, apiPerPage)
    });
  });

  describe("エッジケース", () => {
    it("結果が0件の場合", () => {
      // Arrange
      const params = { ...defaultParams, totalCount: 0 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.totalPages).toBe(1); // max(1, 0) = 1
      expect(result.effectiveTotalCount).toBe(0);
    });

    it("perPageより少ない結果の場合", () => {
      // Arrange
      const params = { ...defaultParams, totalCount: 10 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.totalPages).toBe(1);
      expect(result.displayedCount).toBe(10);
    });

    it("ちょうどperPageと同じ件数の場合", () => {
      // Arrange
      const params = { ...defaultParams, totalCount: 30 };

      // Act
      const result = computePaginationMetrics(params);

      // Assert
      expect(result.totalPages).toBe(1);
      expect(result.displayedCount).toBe(30);
    });
  });
});

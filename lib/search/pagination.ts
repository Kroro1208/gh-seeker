type PaginationParams = {
  page: number;
  perPage: number;
  totalCount: number;
  filteredCount: number;
  isFiltered: boolean;
  apiPerPage: number;
  maxSearchResults: number;
};

export type PaginationMetrics = {
  effectivePage: number;
  totalPages: number;
  effectiveTotalCount: number;
  displayedCount: number;
  apiPage: number;
  pageSliceStart: number;
  pageSliceEnd: number;
};

// GitHubの検索APIの制限に基づいて、ページネーションのメトリクスを計算
// 「最大1000件まで」「1リクエストあたり最大100件まで」
export function computePaginationMetrics({
  page,
  perPage,
  totalCount,
  filteredCount,
  isFiltered,
  apiPerPage,
  maxSearchResults,
}: PaginationParams): PaginationMetrics {
  const maxPage = Math.ceil(maxSearchResults / perPage);
  // ユーザーが直接URLに不正なページ番号を入力した場合の補正をしておく
  const effectivePage = Math.min(Math.max(page, 1), maxPage);
  const offset = (effectivePage - 1) * perPage; //

  // totalCountをmaxSearchResultsで制限
  const limitedTotal = Math.min(totalCount, maxSearchResults);
  // フィルタリングされている場合はfilteredCountを使用し、そうでない場合はlimitedTotalを使用
  const effectiveTotal = isFiltered
    ? Math.min(filteredCount, apiPerPage)
    : limitedTotal;

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / perPage));

  return {
    effectivePage,
    totalPages,
    effectiveTotalCount: effectiveTotal,
    displayedCount: Math.min(effectivePage * perPage, effectiveTotal),
    apiPage: Math.floor(offset / apiPerPage) + 1, // 100件ごとのAPIページにして、100件超えたらfetchする
    pageSliceStart: offset % apiPerPage,
    pageSliceEnd: (offset % apiPerPage) + perPage,
  };
}

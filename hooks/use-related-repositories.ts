"use client";

import { useMemo } from "react";
import { useSearchRepositories } from "@/lib/github/use-search-repository";
import { buildRelatedQuery } from "@/lib/search/related";
import { Repository } from "@/lib/github/types";

export type RelatedRepositoriesState = {
  items: Repository[];
  isLoading: boolean;
  error: Error | null;
  hasResults: boolean;
};

/**
 * 関連リポジトリを取得するカスタムフック
 * メイン検索とFallback検索のロジックを統合
 */
export function useRelatedRepositories(
  repository: Repository | undefined,
  owner: string,
  repo: string,
): RelatedRepositoriesState {
  // メイン検索クエリ（トピック＋言語＋キーワード）
  const relatedQuery = useMemo(
    () => buildRelatedQuery(repository, owner, repo),
    [repository, owner, repo],
  );

  // Fallbackクエリ（言語のみ）
  const fallbackQuery = useMemo(() => {
    if (!repository?.language) return "";
    return `language:${repository.language} -repo:${owner}/${repo}`;
  }, [repository, owner, repo]);

  // メイン検索
  const {
    data: relatedData,
    isLoading: relatedLoading,
    error: relatedError,
  } = useSearchRepositories({
    q: relatedQuery,
    sort: "stars",
    order: "desc",
    per_page: 6,
    page: 1,
  });

  // Fallback検索を行うかどうかの判定
  const shouldFetchFallback =
    Boolean(fallbackQuery) &&
    !relatedLoading &&
    Boolean(relatedData) &&
    relatedData?.items.length === 0;

  // Fallback検索
  const {
    data: fallbackData,
    isLoading: fallbackLoading,
    error: fallbackError,
  } = useSearchRepositories(
    {
      q: fallbackQuery,
      sort: "stars",
      order: "desc",
      per_page: 6,
      page: 1,
    },
    { enabled: shouldFetchFallback },
  );

  // 結果を統合
  const items = useMemo(() => {
    if (relatedData && relatedData.items.length > 0) {
      return relatedData.items;
    }
    if (fallbackData && fallbackData.items.length > 0) {
      return fallbackData.items;
    }
    return [];
  }, [relatedData, fallbackData]);

  const isLoading =
    relatedLoading || (relatedData?.items.length === 0 && fallbackLoading);

  const error = relatedError && fallbackError ? (relatedError as Error) : null;

  return {
    items,
    isLoading,
    error,
    hasResults: items.length > 0,
  };
}

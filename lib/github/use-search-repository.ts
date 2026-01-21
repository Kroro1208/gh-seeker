import { queryOptions, useQuery } from "@tanstack/react-query";
import { searchRepositories, getRepository } from "./client";
import { SearchRepositoriesParams } from "./types";

// queryOptionsを使ってリポジトリ検索
const searchRepositoriesOptions = (
  params: SearchRepositoriesParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: ["repositories", "search", params],
    queryFn: () => searchRepositories(params),
    enabled: options?.enabled ?? Boolean(params.q && params.q.trim() !== ""),
  });

export function useSearchRepositories(
  params: SearchRepositoriesParams,
  options?: { enabled?: boolean },
) {
  return useQuery(searchRepositoriesOptions(params, options));
}

// queryOptionsを使ってリポジトリ詳細情報を取得
// リポジトリ名が変更された場合でもキャッシュをヒットさせるためにIDもしくはowner/repoでキャッシュキーを生成
const repositoryOptions = (owner: string, repo: string, repoId?: number) => {
  const cacheKey = Number.isFinite(repoId) ? repoId : `${owner}/${repo}`;

  return queryOptions({
    queryKey: ["repositories", "detail", cacheKey],
    queryFn: () => getRepository(owner, repo),
    enabled: Boolean(owner && repo),
  });
};

export function useRepository(owner: string, repo: string, repoId?: number) {
  return useQuery(repositoryOptions(owner, repo, repoId));
}

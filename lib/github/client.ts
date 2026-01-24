import { z } from "zod";
import {
  SearchRepositoriesParams,
  SearchRepositoriesResponse,
  SearchRepositoriesResponseSchema,
  Repository,
  RepositorySchema,
} from "./types";
import {
  GitHubError,
  GitHubAPIError,
  GitHubNetworkError,
  GitHubValidationError,
  GitHubResponseFormatError,
} from "./errors";
import { HttpClient, defaultHttpClient } from "@/lib/http/client";
import { getGitHubToken } from "@/lib/github/token";

const API_BASE_PATH = "/api/github";

// GitHub APIクライアントの設定
export type GitHubClientConfig = {
  httpClient?: HttpClient;
  basePath?: string;
};

// GitHub APIクライアントを作成
// テスト時にhttpClientを注入可能にする
export function createGitHubClient(config: GitHubClientConfig = {}) {
  const { httpClient = defaultHttpClient, basePath = API_BASE_PATH } = config;

  // ここでラップしてエラー処理、認証ヘッダー、JSON パースなどを一箇所に集約する
  // UI層に不正なデータを漏らさない
  async function fetchAPI<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
  ): Promise<T> {
    const url = `${basePath}${endpoint}`;
    const token = getGitHubToken();
    const headers = token ? { "X-GitHub-Token": token } : undefined;

    try {
      const response = await httpClient.fetch(
        url,
        headers ? { headers } : undefined,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new GitHubAPIError(
          errorData?.message ??
            `GitHub APIリクエストに失敗しました: ${response.statusText}`,
          response.status,
          errorData,
        );
      }

      const data: unknown = await response.json();

      // Zodでバリデーション
      const result = schema.safeParse(data);

      if (!result.success) {
        throw new GitHubResponseFormatError(
          `無効なレスポンス形式です: ${result.error.message}`,
          data,
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof GitHubError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new GitHubNetworkError(`ネットワークエラー: ${error.message}`);
      }

      throw new GitHubNetworkError("不明なエラーです");
    }
  }

  return {
    // 一覧検索
    async searchRepositories(
      params: SearchRepositoriesParams,
    ): Promise<SearchRepositoriesResponse> {
      const { q, sort, order, per_page = 30, page = 1 } = params;

      if (!q || q.trim() === "") {
        throw new GitHubValidationError("Search query is required");
      }

      const searchParams = new URLSearchParams({
        q,
        per_page: per_page.toString(),
        page: page.toString(),
      });

      if (sort) {
        searchParams.append("sort", sort);
      }

      if (order) {
        searchParams.append("order", order);
      }

      return fetchAPI(
        `/search?${searchParams.toString()}`,
        SearchRepositoriesResponseSchema,
      );
    },

    // 詳細取得
    async getRepository(owner: string, repo: string): Promise<Repository> {
      if (!owner || !repo) {
        throw new GitHubValidationError(
          "Owner and repository name are required",
        );
      }

      return fetchAPI(`/repositories/${owner}/${repo}`, RepositorySchema);
    },
  };
}

// デフォルトのクライアントインスタンス（後方互換性のため）
const defaultClient = createGitHubClient();

export const searchRepositories = defaultClient.searchRepositories;
export const getRepository = defaultClient.getRepository;

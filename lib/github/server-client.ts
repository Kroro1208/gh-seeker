import { z } from "zod";
import {
  SearchRepositoriesParams,
  SearchRepositoriesResponse,
  SearchRepositoriesResponseSchema,
  Repository,
  RepositorySchema,
} from "./types";
import { logger, serializeError } from "@/lib/logger";
import { GITHUB_CONFIG } from "@/lib/config";

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }
}

// ここでラップしてエラー処理、認証ヘッダー、JSON パースなどを一箇所に集約する
// UI層に不正なデータを漏らさない
async function fetchGitHub<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  tokenOverride?: string,
): Promise<T> {
  const token = tokenOverride?.trim() || process.env.GITHUB_TOKEN;

  if (!token) {
    const error = new GitHubAPIError(
      "GitHub token is not configured",
      401, // 認証エラーとして扱う
    );
    logger.error("GitHub token not configured", {
      endpoint,
      hasOverride: Boolean(tokenOverride),
    });
    throw error;
  }

  const url = `${GITHUB_CONFIG.API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_CONFIG.API_VERSION,
      },
      next: {
        revalidate: GITHUB_CONFIG.CACHE_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // ステータスコードとレスポンスデータのみを保持
      // 詳細なメッセージは error-handler.ts で処理
      throw new GitHubAPIError(
        `GitHub API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData,
      );
    }

    const data: unknown = await response.json();

    const result = schema.safeParse(data);

    if (!result.success) {
      logger.error("Invalid GitHub API response format", {
        endpoint,
        validationError: result.error.message,
        responseData: data,
      });

      throw new GitHubAPIError(
        `Invalid response format: ${result.error.message}`,
        500, // サーバー側の問題として扱う
        data,
      );
    }

    return result.data;
  } catch (error) {
    // GitHubAPIError はそのまま再スロー
    if (error instanceof GitHubAPIError) {
      throw error;
    }

    // ネットワークエラー等の予期しないエラー
    logger.error("APIリクエストエラー", {
      endpoint,
      error: serializeError(error),
    });

    if (error instanceof Error) {
      throw new GitHubAPIError(
        `ネットワークエラー等の予期しないエラー: ${error.message}`,
        503,
      ); // Service Unavailable
    }

    throw new GitHubAPIError("不明なエラーが発生しました", 500);
  }
}

// 一覧取得
export async function searchRepositories(
  params: SearchRepositoriesParams,
  tokenOverride?: string,
): Promise<SearchRepositoriesResponse> {
  const { q, sort, order, per_page = 30, page = 1 } = params;

  // クライアントエラーとして適切なステータスコードを設定
  if (!q || q.trim() === "") {
    throw new GitHubAPIError("検索クエリは必須です", 400);
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

  return fetchGitHub(
    `/search/repositories?${searchParams.toString()}`,
    SearchRepositoriesResponseSchema,
    tokenOverride,
  );
}

// 詳細取得
export async function getRepository(
  owner: string,
  repo: string,
  tokenOverride?: string,
): Promise<Repository> {
  return fetchGitHub(
    `/repos/${owner}/${repo}`,
    RepositorySchema,
    tokenOverride,
  );
}

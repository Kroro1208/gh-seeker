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

const API_BASE_PATH = "/api/github";

async function fetchAPI<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const url = `${API_BASE_PATH}${endpoint}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new GitHubAPIError(
        errorData?.message ??
          `GitHub API request failed: ${response.statusText}`,
        response.status,
        errorData,
      );
    }

    const data: unknown = await response.json();

    // Zodでバリデーション
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new GitHubResponseFormatError(
        `Invalid response format: ${result.error.message}`,
        data,
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new GitHubNetworkError(`Network error: ${error.message}`);
    }

    throw new GitHubNetworkError("Unknown error occurred");
  }
}

export async function searchRepositories(
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
}

export async function getRepository(
  owner: string,
  repo: string,
): Promise<Repository> {
  if (!owner || !repo) {
    throw new GitHubValidationError("Owner and repository name are required");
  }

  return fetchAPI(`/repositories/${owner}/${repo}`, RepositorySchema);
}

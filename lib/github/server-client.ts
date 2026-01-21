import { z } from "zod";
import {
  SearchRepositoriesParams,
  SearchRepositoriesResponse,
  SearchRepositoriesResponseSchema,
  Repository,
  RepositorySchema,
} from "./types";

const GITHUB_API_BASE_URL = "https://api.github.com";

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

async function fetchGitHub<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new GitHubAPIError(
      "GITHUB_TOKEN is not configured. Please set it in .env.local",
    );
  }

  const url = `${GITHUB_API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: {
        revalidate: 60, // キャッシュ60秒
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new GitHubAPIError(
          "Unauthorized. Please check your GitHub token.",
          401,
          errorData,
        );
      }

      if (response.status === 403) {
        throw new GitHubAPIError(
          "Forbidden. You may have hit the rate limit.",
          403,
          errorData,
        );
      }

      if (response.status === 422) {
        throw new GitHubAPIError(
          "Validation failed. Please check your search query.",
          422,
          errorData,
        );
      }

      throw new GitHubAPIError(
        `GitHub API request failed: ${response.statusText}`,
        response.status,
        errorData,
      );
    }

    const data: unknown = await response.json();

    const result = schema.safeParse(data);

    if (!result.success) {
      throw new GitHubAPIError(
        `Invalid response format: ${result.error.message}`,
        undefined,
        data,
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new GitHubAPIError(`Network error: ${error.message}`);
    }

    throw new GitHubAPIError("Unknown error occurred");
  }
}

export async function searchRepositories(
  params: SearchRepositoriesParams,
): Promise<SearchRepositoriesResponse> {
  const { q, sort, order, per_page = 30, page = 1 } = params;

  if (!q || q.trim() === "") {
    throw new GitHubAPIError("Search query is required");
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
  );
}

export async function getRepository(
  owner: string,
  repo: string,
): Promise<Repository> {
  if (!owner || !repo) {
    throw new GitHubAPIError("Owner and repository name are required");
  }

  return fetchGitHub(`/repos/${owner}/${repo}`, RepositorySchema);
}

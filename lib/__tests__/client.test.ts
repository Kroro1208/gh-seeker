import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGitHubClient } from "../github/client";
import {
  GitHubAPIError,
  GitHubNetworkError,
  GitHubValidationError,
  GitHubResponseFormatError,
} from "../github/errors";
import type { HttpClient } from "../http/client";

// getGitHubToken をモック
vi.mock("../github/token", () => ({
  getGitHubToken: vi.fn(() => null),
}));

import { getGitHubToken } from "../github/token";

// モック用のHttpClientを作成するヘルパー
function createMockHttpClient(
  mockFetch: (url: string, init?: RequestInit) => Promise<Response>,
): HttpClient {
  return { fetch: mockFetch };
}

// 成功レスポンスを作成するヘルパー
function createSuccessResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// エラーレスポンスを作成するヘルパー
function createErrorResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 404 ? "Not Found" : "Error",
    headers: { "Content-Type": "application/json" },
  });
}

// テスト用のモックデータ
const mockOwner = {
  id: 1,
  login: "testuser",
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  html_url: "https://github.com/testuser",
  type: "User" as const,
};

const mockRepository = {
  id: 123,
  name: "test-repo",
  full_name: "testuser/test-repo",
  owner: mockOwner,
  html_url: "https://github.com/testuser/test-repo",
  description: "A test repository",
  language: "TypeScript",
  stargazers_count: 100,
  watchers_count: 50,
  forks_count: 25,
  open_issues_count: 5,
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  pushed_at: "2024-01-15T00:00:00Z",
  license: null,
};

const mockSearchResponse = {
  total_count: 1,
  incomplete_results: false,
  items: [mockRepository],
};

describe("createGitHubClient", () => {
  beforeEach(() => {
    vi.mocked(getGitHubToken).mockReturnValue(null);
  });

  describe("searchRepositories", () => {
    it("成功時にリポジトリ一覧を返す", async () => {
      // Arrange
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createSuccessResponse(mockSearchResponse));
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act
      const result = await client.searchRepositories({ q: "test" });

      // Assert
      expect(result.total_count).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("test-repo");
    });

    it("パラメータが正しくURLに含まれる", async () => {
      // Arrange
      let capturedUrl = "";
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve(createSuccessResponse(mockSearchResponse));
      });
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
        basePath: "/api/github",
      });

      // Act
      await client.searchRepositories({
        q: "react",
        sort: "stars",
        order: "desc",
        per_page: 50,
        page: 2,
      });

      // Assert
      expect(capturedUrl).toContain("/api/github/search?");
      const url = new URL(capturedUrl, "http://localhost");
      expect(url.searchParams.get("q")).toBe("react");
      expect(url.searchParams.get("sort")).toBe("stars");
      expect(url.searchParams.get("order")).toBe("desc");
      expect(url.searchParams.get("per_page")).toBe("50");
      expect(url.searchParams.get("page")).toBe("2");
    });

    it("空クエリで GitHubValidationError をスローする", async () => {
      // Arrange
      const mockFetch = vi.fn();
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act & Assert
      await expect(client.searchRepositories({ q: "" })).rejects.toThrow(
        GitHubValidationError,
      );
      await expect(client.searchRepositories({ q: "  " })).rejects.toThrow(
        GitHubValidationError,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("APIエラー時に GitHubAPIError をスローする", async () => {
      // Arrange
      const mockFetch = vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(
            createErrorResponse(401, { message: "Bad credentials" }),
          ),
        );
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act & Assert
      const error = await client
        .searchRepositories({ q: "test" })
        .catch((e) => e);
      expect(error).toBeInstanceOf(GitHubAPIError);
      expect(error.status).toBe(401);
      expect(error.response).toEqual({ message: "Bad credentials" });
    });

    it("ネットワークエラー時に GitHubNetworkError をスローする", async () => {
      // Arrange
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure"));
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act & Assert
      await expect(client.searchRepositories({ q: "test" })).rejects.toThrow(
        GitHubNetworkError,
      );
    });

    it("レスポンス形式が不正な場合に GitHubResponseFormatError をスローする", async () => {
      // Arrange
      const invalidResponse = {
        total_count: "not a number", // 数値であるべき
        incomplete_results: false,
        items: [],
      };
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createSuccessResponse(invalidResponse));
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act & Assert
      await expect(client.searchRepositories({ q: "test" })).rejects.toThrow(
        GitHubResponseFormatError,
      );
    });

    it("トークンがある場合にヘッダーに含める", async () => {
      // Arrange
      vi.mocked(getGitHubToken).mockReturnValue("ghp_test_token");
      let capturedInit: RequestInit | undefined;
      const mockFetch = vi
        .fn()
        .mockImplementation((_url: string, init?: RequestInit) => {
          capturedInit = init;
          return Promise.resolve(createSuccessResponse(mockSearchResponse));
        });
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act
      await client.searchRepositories({ q: "test" });

      // Assert
      expect(capturedInit?.headers).toEqual({
        "X-GitHub-Token": "ghp_test_token",
      });
    });
  });

  describe("getRepository", () => {
    it("成功時にリポジトリ詳細を返す", async () => {
      // Arrange
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createSuccessResponse(mockRepository));
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act
      const result = await client.getRepository("testuser", "test-repo");

      // Assert
      expect(result.name).toBe("test-repo");
      expect(result.full_name).toBe("testuser/test-repo");
      expect(result.stargazers_count).toBe(100);
    });

    it("正しいURLでリクエストする", async () => {
      // Arrange
      let capturedUrl = "";
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve(createSuccessResponse(mockRepository));
      });
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
        basePath: "/api/github",
      });

      // Act
      await client.getRepository("owner", "repo-name");

      // Assert
      expect(capturedUrl).toBe("/api/github/repositories/owner/repo-name");
    });

    it("ownerが空の場合に GitHubValidationError をスローする", async () => {
      // Arrange
      const mockFetch = vi.fn();
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act & Assert
      await expect(client.getRepository("", "repo")).rejects.toThrow(
        GitHubValidationError,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("repoが空の場合に GitHubValidationError をスローする", async () => {
      // Arrange
      const mockFetch = vi.fn();
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act & Assert
      await expect(client.getRepository("owner", "")).rejects.toThrow(
        GitHubValidationError,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("404エラー時に GitHubAPIError をスローする", async () => {
      // Arrange
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createErrorResponse(404, { message: "Not Found" }));
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
      });

      // Act & Assert
      await expect(
        client.getRepository("owner", "nonexistent"),
      ).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe("カスタム設定", () => {
    it("basePathをカスタマイズできる", async () => {
      // Arrange
      let capturedUrl = "";
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve(createSuccessResponse(mockSearchResponse));
      });
      const client = createGitHubClient({
        httpClient: createMockHttpClient(mockFetch),
        basePath: "/custom/api",
      });

      // Act
      await client.searchRepositories({ q: "test" });

      // Assert
      expect(capturedUrl).toContain("/custom/api/search?");
    });
  });
});

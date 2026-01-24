import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  searchRepositories,
  getRepository,
  GitHubAPIError,
} from "../github/server-client";

// MSW サーバーのセットアップ（管理下にない外部依存をモック）
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => server.resetHandlers());
afterEach(() => {
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("searchRepositories", () => {
  const mockOwner = {
    id: 1,
    login: "user",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    html_url: "https://github.com/user",
    type: "User" as const,
  };

  it("成功時にリポジトリ一覧を返す", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/search/repositories", () => {
        return HttpResponse.json({
          total_count: 2,
          incomplete_results: false,
          items: [
            {
              id: 1,
              name: "test-repo-1",
              full_name: "user/test-repo-1",
              description: "Test repository 1",
              html_url: "https://github.com/user/test-repo-1",
              stargazers_count: 100,
              watchers_count: 100,
              forks_count: 10,
              open_issues_count: 5,
              language: "TypeScript",
              owner: mockOwner,
              created_at: "2020-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
              pushed_at: "2024-01-15T00:00:00Z",
              license: null,
            },
            {
              id: 2,
              name: "test-repo-2",
              full_name: "user/test-repo-2",
              description: "Test repository 2",
              html_url: "https://github.com/user/test-repo-2",
              stargazers_count: 50,
              watchers_count: 50,
              forks_count: 5,
              open_issues_count: 2,
              language: "JavaScript",
              owner: mockOwner,
              created_at: "2020-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
              pushed_at: "2024-01-15T00:00:00Z",
              license: null,
            },
          ],
        });
      }),
    );

    // Act
    const result = await searchRepositories({ q: "test" }, "ghp_test_token");

    // Assert
    expect(result.total_count).toBe(2);
    expect(result.incomplete_results).toBe(false);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("test-repo-1");
    expect(result.items[0].stargazers_count).toBe(100);
    expect(result.items[1].name).toBe("test-repo-2");
  });

  it("ソート・順序・ページング パラメータを正しく送信する", async () => {
    // Arrange
    let capturedUrl = "";
    server.use(
      http.get("https://api.github.com/search/repositories", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          total_count: 0,
          incomplete_results: false,
          items: [],
        });
      }),
    );

    // Act
    await searchRepositories(
      {
        q: "react",
        sort: "stars",
        order: "desc",
        per_page: 50,
        page: 2,
      },
      "ghp_test",
    );

    // Assert
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("q")).toBe("react");
    expect(url.searchParams.get("sort")).toBe("stars");
    expect(url.searchParams.get("order")).toBe("desc");
    expect(url.searchParams.get("per_page")).toBe("50");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("401 エラー時に GitHubAPIError をスローする", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/search/repositories", () => {
        return HttpResponse.json(
          { message: "Bad credentials" },
          { status: 401 },
        );
      }),
    );

    // Act & Assert
    await expect(
      searchRepositories({ q: "test" }, "invalid_token"),
    ).rejects.toThrow(GitHubAPIError);

    await expect(
      searchRepositories({ q: "test" }, "invalid_token"),
    ).rejects.toMatchObject({
      status: 401,
      response: { message: "Bad credentials" },
    });
  });

  it("403 エラー時に GitHubAPIError をスローする", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/search/repositories", () => {
        return HttpResponse.json(
          { message: "API rate limit exceeded" },
          { status: 403 },
        );
      }),
    );

    // Act & Assert
    await expect(
      searchRepositories({ q: "test" }, "ghp_test"),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it("404 エラー時に GitHubAPIError をスローする", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/search/repositories", () => {
        return HttpResponse.json({ message: "Not Found" }, { status: 404 });
      }),
    );

    // Act & Assert
    await expect(
      searchRepositories({ q: "test" }, "ghp_test"),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it("422 エラー時に GitHubAPIError をスローする", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/search/repositories", () => {
        return HttpResponse.json(
          { message: "Validation Failed" },
          { status: 422 },
        );
      }),
    );

    // Act & Assert
    await expect(
      searchRepositories({ q: "" }, "ghp_test"),
    ).rejects.toMatchObject({
      status: 400, // クライアントエラー
    });
  });

  it("ネットワークエラー時に GitHubAPIError をスローする", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/search/repositories", () => {
        return HttpResponse.error();
      }),
    );

    // Act & Assert
    await expect(searchRepositories({ q: "test" }, "ghp_test")).rejects.toThrow(
      GitHubAPIError,
    );

    await expect(
      searchRepositories({ q: "test" }, "ghp_test"),
    ).rejects.toMatchObject({
      status: 503,
    });
  });
});

describe("getRepository", () => {
  const mockOwner = {
    id: 1,
    login: "user",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    html_url: "https://github.com/user",
    type: "User" as const,
  };

  it("成功時にリポジトリ詳細を返す", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/repos/user/test-repo", () => {
        return HttpResponse.json({
          id: 123,
          name: "test-repo",
          full_name: "user/test-repo",
          description: "A test repository",
          html_url: "https://github.com/user/test-repo",
          stargazers_count: 100,
          watchers_count: 50,
          forks_count: 25,
          open_issues_count: 5,
          language: "TypeScript",
          topics: ["testing", "typescript"],
          created_at: "2020-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          pushed_at: "2024-01-15T00:00:00Z",
          owner: mockOwner,
          license: null,
        });
      }),
    );

    // Act
    const result = await getRepository("user", "test-repo", "ghp_test");

    // Assert
    expect(result.name).toBe("test-repo");
    expect(result.full_name).toBe("user/test-repo");
    expect(result.stargazers_count).toBe(100);
    expect(result.language).toBe("TypeScript");
    expect(result.topics).toEqual(["testing", "typescript"]);
  });

  it("404 エラー時に GitHubAPIError をスローする", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/repos/user/nonexistent", () => {
        return HttpResponse.json({ message: "Not Found" }, { status: 404 });
      }),
    );

    // Act & Assert
    await expect(
      getRepository("user", "nonexistent", "ghp_test"),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it("401 エラー時に GitHubAPIError をスローする", async () => {
    // Arrange
    server.use(
      http.get("https://api.github.com/repos/private-user/private-repo", () => {
        return HttpResponse.json(
          { message: "Bad credentials" },
          { status: 401 },
        );
      }),
    );

    // Act & Assert
    await expect(
      getRepository("private-user", "private-repo", "invalid_token"),
    ).rejects.toMatchObject({
      status: 401,
    });
  });
});

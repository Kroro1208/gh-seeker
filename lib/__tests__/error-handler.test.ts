import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleAPIError } from "../api/error-handler";
import { GitHubAPIError } from "../github/server-client";
import * as loggerModule from "../logger";

// logger をモック（システム境界）
vi.mock("../logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
  serializeError: vi.fn((error) => ({
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : undefined,
  })),
}));

describe("handleAPIError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("開発環境", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    it("GitHubAPIError (401) を適切なレスポンスに変換する", async () => {
      // Arrange
      const error = new GitHubAPIError(
        "GitHub API error: 401 Unauthorized",
        401,
        { message: "Bad credentials" },
      );

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.message).toBe(
        "認証に失敗しました。GitHubトークンを確認してください。",
      );
      expect(data.details.originalMessage).toBe(
        "GitHub API error: 401 Unauthorized",
      );
      expect(data.details.response).toEqual({ message: "Bad credentials" });
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        "GitHub API error",
        expect.objectContaining({
          status: 401,
        }),
      );
    });

    it("GitHubAPIError (403) を適切なレスポンスに変換する", async () => {
      // Arrange
      const error = new GitHubAPIError("GitHub API error: 403 Forbidden", 403, {
        message: "Rate limit exceeded",
      });

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.message).toBe(
        "アクセスが拒否されました。レート制限に達した可能性があります。しばらく待ってから再度お試しください。",
      );
      expect(data.details.originalMessage).toBe(
        "GitHub API error: 403 Forbidden",
      );
    });

    it("GitHubAPIError (404) を適切なレスポンスに変換する", async () => {
      // Arrange
      const error = new GitHubAPIError("GitHub API error: 404 Not Found", 404, {
        message: "Not Found",
      });

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.message).toBe("リソースが見つかりませんでした。");
    });

    it("GitHubAPIError (422) を適切なレスポンスに変換する", async () => {
      // Arrange
      const error = new GitHubAPIError(
        "GitHub API error: 422 Unprocessable Entity",
        422,
        { message: "Validation Failed" },
      );

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(422);
      expect(data.message).toBe(
        "検索クエリが無効です。検索条件を確認してください。",
      );
    });

    it("GitHubAPIError (その他) を適切なレスポンスに変換する", async () => {
      // Arrange
      const error = new GitHubAPIError(
        "GitHub API error: 500 Internal Server Error",
        500,
        { message: "Internal Error" },
      );

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.message).toBe(
        "エラーが発生しました。しばらく待ってから再度お試しください。",
      );
    });

    it("通常の Error を 500 レスポンスに変換する", async () => {
      // Arrange
      const error = new Error("Unexpected error");

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.message).toBe("予期しないエラーが発生しました。");
      expect(data.details.message).toBe("Unexpected error");
      expect(data.details.stack).toBeDefined();
      expect(loggerModule.logger.error).toHaveBeenCalledWith(
        "Unexpected API error",
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Unexpected error",
          }),
        }),
      );
    });

    it("Error 以外のオブジェクトを 500 レスポンスに変換する", async () => {
      // Arrange
      const error = "string error";

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.message).toBe("予期しないエラーが発生しました。");
      expect(data.details).toBeUndefined();
    });
  });

  describe("本番環境", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
    });

    it("GitHubAPIError (401) を詳細情報なしで返す", async () => {
      // Arrange
      const error = new GitHubAPIError(
        "GitHub API error: 401 Unauthorized",
        401,
        { message: "Bad credentials" },
      );

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.message).toBe(
        "認証に失敗しました。GitHubトークンを確認してください。",
      );
      expect(data.details).toBeUndefined();
    });

    it("通常の Error を詳細情報なしで返す", async () => {
      // Arrange
      const error = new Error("Unexpected error");

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.message).toBe("予期しないエラーが発生しました。");
      expect(data.details).toBeUndefined();
    });
  });
});

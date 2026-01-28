import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setGitHubToken,
  hasGitHubToken,
  clearGitHubToken,
} from "../github/token";
import * as loggerModule from "../logger";

// logger をモック（システム境界）
vi.mock("../logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
  serializeError: vi.fn((error) => ({
    message: error instanceof Error ? error.message : String(error),
  })),
}));

// fetch をモック
const mockFetch = vi.fn();

describe("Token API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("setGitHubToken", () => {
    it("トークンを保存APIに送信する", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      const result = await setGitHubToken(
        "ghp_test123456789012345678901234567890",
      );

      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "ghp_test123456789012345678901234567890",
        }),
      });
    });

    it("トークンをトリミングして送信する", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await setGitHubToken("  ghp_test123456789012345678901234567890  ");

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "ghp_test123456789012345678901234567890",
        }),
      });
    });

    it("空文字列の場合は削除APIを呼ぶ", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      const result = await setGitHubToken("");

      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/token", {
        method: "DELETE",
      });
    });

    it("空白のみの場合は削除APIを呼ぶ", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      const result = await setGitHubToken("   ");

      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/token", {
        method: "DELETE",
      });
    });

    it("API エラー時は false を返しログに記録する", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid token format" }),
      });

      // Act
      const result = await setGitHubToken("invalid");

      // Assert
      expect(result).toBe(false);
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        "トークン保存失敗",
        { error: "Invalid token format" },
      );
    });

    it("ネットワークエラー時は false を返しログに記録する", async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act
      const result = await setGitHubToken(
        "ghp_test123456789012345678901234567890",
      );

      // Assert
      expect(result).toBe(false);
      expect(loggerModule.logger.error).toHaveBeenCalledWith(
        "トークン保存エラー",
        expect.objectContaining({
          error: { message: "Network error" },
        }),
      );
    });
  });

  describe("hasGitHubToken", () => {
    it("トークンが存在する場合は true を返す", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasToken: true }),
      });

      // Act
      const result = await hasGitHubToken();

      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/token");
    });

    it("トークンが存在しない場合は false を返す", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasToken: false }),
      });

      // Act
      const result = await hasGitHubToken();

      // Assert
      expect(result).toBe(false);
    });

    it("API エラー時は false を返す", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      // Act
      const result = await hasGitHubToken();

      // Assert
      expect(result).toBe(false);
    });

    it("ネットワークエラー時は false を返す", async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act
      const result = await hasGitHubToken();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("clearGitHubToken", () => {
    it("削除APIを呼ぶ", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      const result = await clearGitHubToken();

      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/token", {
        method: "DELETE",
      });
    });

    it("エラー時は false を返す", async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act
      const result = await clearGitHubToken();

      // Assert
      expect(result).toBe(false);
    });
  });
});

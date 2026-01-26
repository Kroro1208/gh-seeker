import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGitHubToken, setGitHubToken } from "../github/token";
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

describe("getGitHubToken", () => {
  beforeEach(() => {
    // sessionStorage をクリア
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("サーバーサイドでは null を返す", () => {
    // Arrange
    const originalWindow = global.window;
    // @ts-expect-error - テスト用に window を削除
    delete global.window;

    // Act
    const result = getGitHubToken();

    // Assert
    expect(result).toBeNull();

    // Cleanup
    global.window = originalWindow;
  });

  it("sessionStorage からトークンを取得する", () => {
    // Arrange
    sessionStorage.setItem("github_token", "ghp_test123");

    // Act
    const result = getGitHubToken();

    // Assert
    expect(result).toBe("ghp_test123");
  });

  it("トークンが保存されていない場合は null を返す", () => {
    // Act
    const result = getGitHubToken();

    // Assert
    expect(result).toBeNull();
  });

  it("sessionStorage エラー時は null を返しログに記録する", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });

    // Act
    const result = getGitHubToken();

    // Assert
    expect(result).toBeNull();
    expect(loggerModule.logger.warn).toHaveBeenCalledWith(
      "セッションストレージ読み取り失敗",
      expect.objectContaining({
        key: "github_token",
      }),
    );
  });
});

describe("setGitHubToken", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("サーバーサイドでは何もしない", () => {
    // Arrange
    const originalWindow = global.window;
    // @ts-expect-error - テスト用に window を削除
    delete global.window;

    // Act
    setGitHubToken("ghp_test123");

    // Assert: エラーが発生しないことを確認
    expect(true).toBe(true);

    // Cleanup
    global.window = originalWindow;
  });

  it("トークンを sessionStorage に保存する", () => {
    // Act
    setGitHubToken("ghp_test123");

    // Assert
    expect(sessionStorage.getItem("github_token")).toBe("ghp_test123");
  });

  it("トリミングしてトークンを保存する", () => {
    // Act
    setGitHubToken("  ghp_test123  ");

    // Assert
    expect(sessionStorage.getItem("github_token")).toBe("ghp_test123");
  });

  it("空文字列の場合はトークンを削除する", () => {
    // Arrange
    sessionStorage.setItem("github_token", "existing_token");

    // Act
    setGitHubToken("");

    // Assert
    expect(sessionStorage.getItem("github_token")).toBeNull();
  });

  it("空白のみの場合はトークンを削除する", () => {
    // Arrange
    sessionStorage.setItem("github_token", "existing_token");

    // Act
    setGitHubToken("   ");

    // Assert
    expect(sessionStorage.getItem("github_token")).toBeNull();
  });

  it("sessionStorage エラー時はログに記録する", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });

    // Act
    setGitHubToken("ghp_test123");

    // Assert
    expect(loggerModule.logger.error).toHaveBeenCalledWith(
      "セッションストレージ書き込み失敗",
      expect.objectContaining({
        key: "github_token",
        hasToken: true,
      }),
    );
  });
});

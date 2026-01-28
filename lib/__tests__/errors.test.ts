import { describe, it, expect } from "vitest";
import {
  getErrorPresentation,
  GitHubAPIError,
  GitHubNetworkError,
  GitHubValidationError,
  GitHubResponseFormatError,
  GitHubError,
} from "../github/errors";

describe("getErrorPresentation", () => {
  describe("GitHubValidationError", () => {
    it("入力エラーとして表示し、再試行不可", () => {
      // Arrange
      const error = new GitHubValidationError("検索クエリが空です");

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("入力エラーです。");
      expect(result.description).toBe("検索クエリが空です");
      expect(result.canRetry).toBe(false);
    });
  });

  describe("GitHubNetworkError", () => {
    it("ネットワークエラーとして表示し、再試行可能", () => {
      // Arrange
      const error = new GitHubNetworkError("接続がタイムアウトしました");

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("ネットワークエラーです。");
      expect(result.description).toBe("通信状況を確認して再試行してください。");
      expect(result.canRetry).toBe(true);
    });
  });

  describe("GitHubResponseFormatError", () => {
    it("レスポンス形式エラーとして表示し、再試行可能", () => {
      // Arrange
      const error = new GitHubResponseFormatError("JSONパースに失敗");

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("レスポンス形式が不正です。");
      expect(result.description).toBe("時間をおいて再試行してください。");
      expect(result.canRetry).toBe(true);
    });
  });

  describe("GitHubAPIError", () => {
    it("404エラーは再試行不可", () => {
      // Arrange
      const error = new GitHubAPIError("リポジトリが見つかりません", 404);

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("データが見つかりませんでした。");
      expect(result.description).toBe("リポジトリが見つかりません");
      expect(result.canRetry).toBe(false);
    });

    it("500エラーは再試行可能", () => {
      // Arrange
      const error = new GitHubAPIError("サーバーエラー", 500);

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("APIエラーが発生しました。");
      expect(result.description).toBe("サーバーエラー");
      expect(result.canRetry).toBe(true);
    });

    it("429エラー（レート制限）は再試行可能", () => {
      // Arrange
      const error = new GitHubAPIError("レート制限に達しました", 429);

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("APIエラーが発生しました。");
      expect(result.canRetry).toBe(true);
    });

    it("401エラーは再試行不可", () => {
      // Arrange
      const error = new GitHubAPIError("認証に失敗しました", 401);

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("APIエラーが発生しました。");
      expect(result.canRetry).toBe(false);
    });

    it("403エラーは再試行不可", () => {
      // Arrange
      const error = new GitHubAPIError("アクセスが拒否されました", 403);

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.canRetry).toBe(false);
    });

    it("ステータスコードがない場合は再試行可能", () => {
      // Arrange
      const error = new GitHubAPIError("不明なエラー");

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.canRetry).toBe(true);
    });
  });

  describe("一般的な Error", () => {
    it("フォールバック表示を返す", () => {
      // Arrange
      const error = new Error("予期しないエラー");

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("エラーが発生しました。");
      expect(result.description).toBe("予期しないエラー");
      expect(result.canRetry).toBe(true);
    });
  });

  describe("Error 以外の値", () => {
    it("文字列の場合は「不明なエラー」を返す", () => {
      // Arrange
      const error = "string error";

      // Act
      const result = getErrorPresentation(error);

      // Assert
      expect(result.title).toBe("エラーが発生しました。");
      expect(result.description).toBe("不明なエラーです");
      expect(result.canRetry).toBe(true);
    });

    it("null の場合は「不明なエラー」を返す", () => {
      // Act
      const result = getErrorPresentation(null);

      // Assert
      expect(result.title).toBe("エラーが発生しました。");
      expect(result.description).toBe("不明なエラーです");
    });

    it("undefined の場合は「不明なエラー」を返す", () => {
      // Act
      const result = getErrorPresentation(undefined);

      // Assert
      expect(result.description).toBe("不明なエラーです");
    });
  });
});

describe("GitHubError クラス階層", () => {
  it("GitHubAPIError は GitHubError を継承している", () => {
    // Arrange
    const error = new GitHubAPIError("test", 500);

    // Assert
    expect(error).toBeInstanceOf(GitHubError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("GitHubAPIError");
  });

  it("GitHubNetworkError は GitHubError を継承している", () => {
    // Arrange
    const error = new GitHubNetworkError("test");

    // Assert
    expect(error).toBeInstanceOf(GitHubError);
    expect(error.name).toBe("GitHubNetworkError");
  });

  it("GitHubValidationError は GitHubError を継承している", () => {
    // Arrange
    const error = new GitHubValidationError("test");

    // Assert
    expect(error).toBeInstanceOf(GitHubError);
    expect(error.name).toBe("GitHubValidationError");
  });

  it("GitHubResponseFormatError は GitHubError を継承している", () => {
    // Arrange
    const error = new GitHubResponseFormatError("test");

    // Assert
    expect(error).toBeInstanceOf(GitHubError);
    expect(error.name).toBe("GitHubResponseFormatError");
  });

  it("GitHubAPIError は response プロパティを持てる", () => {
    // Arrange
    const response = { message: "Bad credentials" };
    const error = new GitHubAPIError("Unauthorized", 401, response);

    // Assert
    expect(error.status).toBe(401);
    expect(error.response).toEqual(response);
  });

  it("GitHubResponseFormatError は response プロパティを持てる", () => {
    // Arrange
    const response = { invalid: "data" };
    const error = new GitHubResponseFormatError("Invalid format", response);

    // Assert
    expect(error.response).toEqual(response);
  });
});

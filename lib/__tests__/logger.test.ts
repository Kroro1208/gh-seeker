import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, serializeError } from "../logger";

describe("logger", () => {
  // Arrange: console メソッドをモック
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("開発環境", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    it("logger.error は console.error を呼び出す", () => {
      // Act
      logger.error("test error", { userId: 123 });

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][1]).toBe("test error");
      expect(consoleErrorSpy.mock.calls[0][2]).toEqual({ userId: 123 });
    });

    it("logger.warn は console.warn を呼び出す", () => {
      // Act
      logger.warn("test warning", { userId: 123 });

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][1]).toBe("test warning");
      expect(consoleWarnSpy.mock.calls[0][2]).toEqual({ userId: 123 });
    });

    it("logger.info は console.info を呼び出す", () => {
      // Act
      logger.info("test info", { userId: 123 });

      // Assert
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy.mock.calls[0][1]).toBe("test info");
      expect(consoleInfoSpy.mock.calls[0][2]).toEqual({ userId: 123 });
    });

    it("context なしでも動作する", () => {
      // Act
      logger.error("test error without context");

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][1]).toBe(
        "test error without context",
      );
      expect(consoleErrorSpy.mock.calls[0][2]).toBeUndefined();
    });
  });

  describe("本番環境", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
    });

    it("logger.error は JSON 形式で console.error を呼び出す", () => {
      // Act
      logger.error("production error", { requestId: "abc123" });

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe("error");
      expect(loggedData.message).toBe("production error");
      expect(loggedData.requestId).toBe("abc123");
      expect(loggedData.timestamp).toBeDefined();
    });

    it("logger.warn は JSON 形式で console.warn を呼び出す", () => {
      // Act
      logger.warn("production warning", { requestId: "abc123" });

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe("warn");
      expect(loggedData.message).toBe("production warning");
      expect(loggedData.requestId).toBe("abc123");
    });

    it("logger.info は何も出力しない", () => {
      // Act
      logger.info("production info");

      // Assert
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});

describe("serializeError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Error オブジェクトをシリアライズする（開発環境）", () => {
    // Arrange
    vi.stubEnv("NODE_ENV", "development");
    const error = new Error("test error");
    error.name = "TestError";

    // Act
    const result = serializeError(error);

    // Assert
    expect(result.message).toBe("test error");
    expect(result.name).toBe("TestError");
    expect(result.stack).toBeDefined();
  });

  it("Error オブジェクトをシリアライズする（本番環境）", () => {
    // Arrange
    vi.stubEnv("NODE_ENV", "production");
    const error = new Error("test error");
    error.name = "TestError";

    // Act
    const result = serializeError(error);

    // Assert
    expect(result.message).toBe("test error");
    expect(result.name).toBe("TestError");
    expect(result.stack).toBeUndefined();
  });

  it("Error 以外のオブジェクトを文字列化する", () => {
    // Act
    const result1 = serializeError("plain string error");
    const result2 = serializeError({ custom: "object" });
    const result3 = serializeError(null);

    // Assert
    expect(result1.message).toBe("plain string error");
    expect(result1.name).toBeUndefined();
    expect(result1.stack).toBeUndefined();

    expect(result2.message).toBe("[object Object]");
    expect(result3.message).toBe("null");
  });
});

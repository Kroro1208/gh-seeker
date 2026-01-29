import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as loggerModule from "../logger";

// logger をモック
vi.mock("../logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
  serializeError: vi.fn((error) => ({
    message: error instanceof Error ? error.message : String(error),
  })),
}));

describe("rate-limit (環境変数未設定)", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("checkRateLimit は常に成功を返し、警告ログを出力する", async () => {
    // Arrange
    const { checkRateLimit } = await import("../rate-limit");

    // Act
    const result = await checkRateLimit("test-identifier");

    // Assert
    expect(result.success).toBe(true);
    expect(result.limit).toBe(0);
    expect(result.remaining).toBe(0);
    expect(result.reset).toBe(0);
    expect(loggerModule.logger.warn).toHaveBeenCalledWith(
      "Rate Limiting is disabled",
      expect.objectContaining({
        identifier: "test-identifier",
      }),
    );
  });
});

describe("rate-limit (エラーハンドリング)", () => {
  // 注: 実際のUpstash Redisとの統合テストは、
  // テスト環境にDockerコンテナ等でRedisを立てて行うべきです。
  // ここでは、エラーハンドリングのロジックのみをテストします。

  it("checkRateLimit は期待される形式のオブジェクトを返す", async () => {
    // Arrange
    vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
    const { checkRateLimit } = await import("../rate-limit");

    // Act
    const result = await checkRateLimit("test-user");

    // Assert
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("reset");
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.limit).toBe("number");
    expect(typeof result.remaining).toBe("number");
    expect(typeof result.reset).toBe("number");

    vi.unstubAllEnvs();
  });
});

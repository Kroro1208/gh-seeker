import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger, serializeError } from "@/lib/logger";
import { RATE_LIMIT_CONFIG } from "@/lib/config";

// Upstash Redisの環境変数が設定されているかチェック
const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

// 本番環境でRate Limitingが無効の場合は警告
if (!isConfigured && process.env.NODE_ENV === "production") {
  logger.error("レートリミットが無効です", {
    message:
      "UPSTASH_REDIS_REST_URLとUPSTASH_REDIS_REST_TOKENを確認してください。",
  });
}

// Rate Limitingのインスタンスを作成（設定されている場合のみ）
export const ratelimit = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      // スライディングウィンドウ: 設定ファイルから取得
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.MAX_REQUESTS,
        `${RATE_LIMIT_CONFIG.WINDOW_SECONDS} s`,
      ),
      // アナリティクス（オプション）
      analytics: true,
      // カスタムプレフィックス
      prefix: "github-search-app",
    })
  : null;

// Rate Limitをチェック
// 設定されていない場合は常に成功を返す（開発環境用）
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!ratelimit) {
    // Rate Limitが無効の場合は警告
    logger.warn("Rate Limiting is disabled", {
      identifier,
      environment: process.env.NODE_ENV,
      message:
        "UPSTASH_REDIS_REST_URLとUPSTASH_REDIS_REST_TOKENを確認してください。",
    });

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  try {
    const { success, limit, remaining, reset } =
      await ratelimit.limit(identifier);

    // Rate Limitに引っかかった場合はログに記録
    if (!success) {
      logger.warn("レートリミット超過", {
        identifier,
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      });
    }

    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    // Upstash Redisへの接続エラー等
    logger.error("Rate limit check failed", {
      identifier,
      error: serializeError(error),
    });

    // フェイルクローズ: エラー時はリクエストを拒否（セキュリティ優先）
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60000, // 1分後にリトライ可能
    };
  }
}

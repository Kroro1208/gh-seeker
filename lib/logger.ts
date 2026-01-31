import { match } from "ts-pattern";

// アプリケーションロガー
// 本番環境でもエラーを追跡できるように設計

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

// エラーログを記録
// 本番環境ではエラー監視サービス（Sentry等）に送信することを想定
function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...context,
  };

  // 開発環境: コンソールに出力
  if (process.env.NODE_ENV === "development") {
    match(level)
      .with("error", () =>
        console.error(`[${timestamp}] ERROR:`, message, context),
      )
      .with("warn", () =>
        console.warn(`[${timestamp}] WARN:`, message, context),
      )
      .with("info", () =>
        console.info(`[${timestamp}] INFO:`, message, context),
      )
      .exhaustive();
    return;
  }

  // 本番環境: エラー監視サービスに送信
  // TODO: Sentry統合時にここを置き換える
  // 現時点ではコンソールに出力（サーバーログに記録される）
  if (level === "error") {
    console.error(JSON.stringify(logData));
    // 将来的な統合例:
    // Sentry.captureException(new Error(message), { extra: context });
  } else if (level === "warn") {
    console.warn(JSON.stringify(logData));
  }
}

export const logger = {
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
};

// エラーオブジェクトをシリアライズ可能な形式に変換
export function serializeError(error: unknown): {
  message: string;
  name?: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return {
    message: String(error),
  };
}

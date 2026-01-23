// GitHub API設定
export const GITHUB_CONFIG = {
  // GitHub APIのベースURL（GitHub Enterprise Serverの場合は環境変数で上書き可能）
  API_BASE_URL: process.env.GITHUB_API_BASE_URL || "https://api.github.com",

  // GitHub APIバージョン
  API_VERSION: "2022-11-28",

  // キャッシュの有効期間（秒）
  CACHE_REVALIDATE_SECONDS: 60,
} as const;

// Rate Limiting設定
export const RATE_LIMIT_CONFIG = {
  // スライディングウィンドウの期間（秒）
  WINDOW_SECONDS: 10,

  // 期間内の最大リクエスト数
  MAX_REQUESTS: 10,
} as const;

// アプリケーション全体の設定
export const APP_CONFIG = {
  GITHUB: GITHUB_CONFIG,
  RATE_LIMIT: RATE_LIMIT_CONFIG,
} as const;

import { logger, serializeError } from "@/lib/logger";

const STORAGE_KEY = "github_token";

// GitHub Personal Access Token を取得
// sessionStorageに保存されているため、タブを閉じると自動的に削除される
export function getGitHubToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch (error) {
    // Private mode、ストレージ無効化、クォータ超過などの場合
    // アプリケーションは継続動作するが、エラーは記録する
    logger.warn("セッションストレージ読み取り失敗", {
      key: STORAGE_KEY,
      error: serializeError(error),
    });
    return null;
  }
}

// GitHub Personal Access Token を保存
// sessionStorageに保存されるため、タブを閉じると自動的に削除される
export function setGitHubToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const trimmed = token.trim();
    if (trimmed) {
      sessionStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    // Private mode、ストレージ無効化、クォータ超過などの場合
    // ユーザーには影響を与えないが、エラーは記録する
    logger.error("セッションストレージ書き込み失敗", {
      key: STORAGE_KEY,
      hasToken: Boolean(token),
      error: serializeError(error),
    });
  }
}

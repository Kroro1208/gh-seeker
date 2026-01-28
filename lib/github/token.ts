import { logger, serializeError } from "@/lib/logger";
import { API_ROUTES } from "@/lib/config";

// トークンをサーバーセッションに保存
export async function setGitHubToken(token: string): Promise<boolean> {
  try {
    const trimmed = token.trim();

    if (!trimmed) {
      // 空の場合は削除
      const res = await fetch(API_ROUTES.AUTH.TOKEN, { method: "DELETE" });
      return res.ok;
    }

    const res = await fetch(API_ROUTES.AUTH.TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: trimmed }),
    });

    if (!res.ok) {
      const data = await res.json();
      logger.warn("トークン保存失敗", { error: data.error });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("トークン保存エラー", { error: serializeError(error) });
    return false;
  }
}

// トークンの存在確認（値は取得しない）
export async function hasGitHubToken(): Promise<boolean> {
  try {
    const res = await fetch(API_ROUTES.AUTH.TOKEN);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.hasToken);
  } catch {
    return false;
  }
}

// トークンを削除
export async function clearGitHubToken(): Promise<boolean> {
  try {
    const res = await fetch(API_ROUTES.AUTH.TOKEN, { method: "DELETE" });
    return res.ok;
  } catch (error) {
    logger.error("トークン削除エラー", { error: serializeError(error) });
    return false;
  }
}

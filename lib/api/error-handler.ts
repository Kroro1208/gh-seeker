import { NextResponse } from "next/server";
import { GitHubAPIError } from "@/lib/github/server-client";
import { logger, serializeError } from "@/lib/logger";

// GitHubAPIErrorをユーザーフレンドリーなメッセージに変換
function getUserFriendlyMessage(error: GitHubAPIError): string {
  switch (error.status) {
    case 401:
      return "認証に失敗しました。GitHubトークンを確認してください。";
    case 403:
      return "アクセスが拒否されました。レート制限に達した可能性があります。しばらく待ってから再度お試しください。";
    case 404:
      return "リソースが見つかりませんでした。";
    case 422:
      return "検索クエリが無効です。検索条件を確認してください。";
    default:
      return "エラーが発生しました。しばらく待ってから再度お試しください。";
  }
}

// エラーをNextResponseに変換
// 本番環境では詳細情報を含めない
export function handleAPIError(error: unknown): NextResponse {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (error instanceof GitHubAPIError) {
    // GitHub APIエラーをログに記録
    logger.warn("GitHub API error", {
      status: error.status,
      message: error.message,
      response: error.response,
    });

    return NextResponse.json(
      {
        message: getUserFriendlyMessage(error),
        ...(isDevelopment && {
          details: {
            originalMessage: error.message,
            response: error.response,
          },
        }),
      },
      { status: error.status ?? 500 },
    );
  }

  // 予期しないエラーの場合はエラーとしてログに記録
  logger.error("Unexpected API error", {
    error: serializeError(error),
  });

  return NextResponse.json(
    {
      message: "予期しないエラーが発生しました。",
      ...(isDevelopment &&
        error instanceof Error && {
          details: {
            message: error.message,
            stack: error.stack,
          },
        }),
    },
    { status: 500 },
  );
}

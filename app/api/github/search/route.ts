import { NextRequest, NextResponse } from "next/server";
import { searchRepositories } from "@/lib/github/server-client";
import { parseSearchParams } from "@/lib/api/parsers";
import { handleAPIError } from "@/lib/api/error-handler";
import { checkRateLimit } from "@/lib/rate-limit";

// 一覧取得API
export async function GET(request: NextRequest) {
  try {
    // Rate Limitチェック（IPアドレスまたはトークンをidentifierとして使用）
    const identifier =
      request.headers.get("x-github-token") ||
      request.headers.get("x-forwarded-for") ||
      "anonymous";

    const { success, limit, remaining, reset } =
      await checkRateLimit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          message:
            "リクエストが多すぎます。しばらく待ってから再度お試しください。",
          rateLimit: {
            limit,
            remaining,
            reset: new Date(reset).toISOString(),
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    const params = parseSearchParams(request.nextUrl.searchParams);
    const token = request.headers.get("x-github-token") ?? undefined;
    const data = await searchRepositories(params, token);

    // Rate Limit情報をレスポンスヘッダーに含める
    return NextResponse.json(data, {
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

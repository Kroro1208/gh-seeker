import { NextResponse } from "next/server";
import { getRepository } from "@/lib/github/server-client";
import { handleAPIError } from "@/lib/api/error-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSessionToken, getSessionIdentifier } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    owner?: string;
    repo?: string;
  }>;
};

// 詳細取得API
export async function GET(request: Request, { params }: RouteContext) {
  try {
    // セッションからidentifierを取得（トークンのハッシュ値）
    const tokenIdentifier = await getSessionIdentifier();
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipIdentifier = forwardedFor?.split(",")[0]?.trim();
    const identifier = tokenIdentifier || ipIdentifier || "anonymous";

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

    const { owner = "", repo = "" } = await params;
    // セッションからトークンを取得
    const token = await getSessionToken();
    const data = await getRepository(owner, repo, token);

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

import { NextRequest, NextResponse } from "next/server";
import { GitHubAPIError, searchRepositories } from "@/lib/github/server-client";
import { parseSearchParams } from "@/lib/api/parsers";

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.nextUrl.searchParams);
    const data = await searchRepositories(params);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      return NextResponse.json(
        { message: error.message, details: error.response },
        { status: error.status ?? 500 },
      );
    }

    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 },
    );
  }
}

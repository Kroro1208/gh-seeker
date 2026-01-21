import { NextRequest, NextResponse } from "next/server";
import { GitHubAPIError, searchRepositories } from "@/lib/github/server-client";
import { SearchRepositoriesParams } from "@/lib/github/types";

// satisfiesを使って配列の型をSearchRepositoriesParams["sort"]に一致させる
const SORT_OPTIONS = ["stars", "updated", "forks"] satisfies Array<
  SearchRepositoriesParams["sort"]
>;

function isSortOption(
  value: string | undefined,
): value is SearchRepositoriesParams["sort"] {
  return SORT_OPTIONS.some((option) => option === value);
}

// 正の整数としてパースする
function parsePositiveInt(value: string | null): number | undefined {
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseSearchParams(request: NextRequest): SearchRepositoriesParams {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? undefined;
  const order = params.get("order") ?? undefined;
  const perPage = params.get("per_page");
  const page = params.get("page");

  const normalizedSort = isSortOption(sort) ? sort : undefined;
  const normalizedOrder =
    normalizedSort && order === "desc" ? "desc" : undefined;

  return {
    q,
    sort: normalizedSort,
    order: normalizedOrder,
    per_page: parsePositiveInt(perPage),
    page: parsePositiveInt(page),
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request);
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

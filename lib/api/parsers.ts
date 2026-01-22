import { SearchRepositoriesParams } from "@/lib/github/types";

// satisfiesを使って配列の型をSearchRepositoriesParams["sort"]に一致させる
const SORT_OPTIONS = ["stars", "updated", "forks"] satisfies Array<
  SearchRepositoriesParams["sort"]
>;

// 値がソートオプションかどうかを判定する型ガード
export function isSortOption(
  value: string | undefined,
): value is SearchRepositoriesParams["sort"] {
  return SORT_OPTIONS.some((option) => option === value);
}

/**
 * 文字列を正の整数としてパースする
 * @param value パースする文字列
 * @returns 正の整数、またはパース失敗時はundefined
 */
export function parsePositiveInt(value: string | null): number | undefined {
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

// URLSearchParamsから検索パラメータをパースする
export function parseSearchParams(
  searchParams: URLSearchParams,
): SearchRepositoriesParams {
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? undefined;
  const order = searchParams.get("order") ?? undefined;
  const perPage = searchParams.get("per_page");
  const page = searchParams.get("page");

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

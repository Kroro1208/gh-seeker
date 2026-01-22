import { createSerializer, parseAsInteger, parseAsString } from "nuqs";

/**
 * 検索パラメータのパーサー定義
 */
export const searchParamsParsers = {
  q: parseAsString,
  repoId: parseAsInteger,
  language: parseAsString,
  sort: parseAsString,
  order: parseAsString,
  page: parseAsInteger,
  per_page: parseAsInteger,
};

/**
 * 検索パラメータをURLクエリ文字列にシリアライズ
 */
export const serializeSearchParams = createSerializer(searchParamsParsers);

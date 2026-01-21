import { z } from "zod";

// Branded Typeで一意性を確保する
declare const __brand: unique symbol;
export type Brand<T, B extends string> = T & { [__brand]: B };

export type RepositoryId = Brand<number, "RepositoryId">;
export type UserId = Brand<number, "UserId">;

// 各種スキーマ定義
// Repository オーナー用スキーマ
export const RepositoryOwnerSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
  type: z.enum(["User", "Organization"]),
});

// リポジトリライセンス用スキーマ
export const RepositoryLicenseSchema = z.object({
  key: z.string(),
  name: z.string(),
  spdx_id: z.string().nullable(),
  url: z.string().url().nullable(),
});

// リポジトリ用スキーマ
export const RepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: RepositoryOwnerSchema,
  html_url: z.string().url(),
  description: z.string().nullable(),
  topics: z.array(z.string()).optional(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  watchers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string().nullable(),
  license: RepositoryLicenseSchema.nullable(),
});

// 検索リポジトリレスポンス用スキーマ
export const SearchRepositoriesResponseSchema = z.object({
  total_count: z.number(),
  incomplete_results: z.boolean(),
  items: z.array(RepositorySchema),
});

// 各スキーマから推論させる
export type RepositoryOwner = z.infer<typeof RepositoryOwnerSchema>;
export type RepositoryLicense = z.infer<typeof RepositoryLicenseSchema>;
export type Repository = z.infer<typeof RepositorySchema>;
export type SearchRepositoriesResponse = z.infer<
  typeof SearchRepositoriesResponseSchema
>;

// 検索用のリポジトリパラメータ型
export type SearchRepositoriesParams = {
  q: string;
  sort?: "stars" | "forks" | "updated";
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
};

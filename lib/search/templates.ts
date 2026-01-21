export type SearchTemplate = {
  label: string;
  value: string;
  example: string;
};

export const SEARCH_TEMPLATES: SearchTemplate[] = [
  {
    label: "ユーザー名で検索",
    value: "user:vercel",
    example: "user:vercel",
  },
  {
    label: "言語で絞り込み",
    value: "language:TypeScript",
    example: "language:TypeScript",
  },
  {
    label: "Star数で絞り込み",
    value: "stars:>1000",
    example: "stars:>1000",
  },
  {
    label: "複合検索",
    value: "user:vercel language:TypeScript",
    example: "user:vercel language:TypeScript",
  },
];

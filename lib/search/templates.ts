export type SearchTemplate = {
  label: string;
  value: string;
  example: string;
};

export const SEARCH_TEMPLATES: SearchTemplate[] = [
  {
    label: "ユーザー名で検索",
    value: "user:Kroro1208",
    example: "user:Kroro1208",
  },
  {
    label: "言語で絞り込み",
    value: "language:TypeScript",
    example: "language:TypeScript",
  },
  {
    label: "Star数で絞り込み",
    value: "stars:>100",
    example: "stars:>100",
  },
  {
    label: "複合検索",
    value: "user:Kroro1208 language:TypeScript",
    example: "user:Kroro1208 language:TypeScript",
  },
];

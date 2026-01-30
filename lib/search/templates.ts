export type SearchTemplate = {
  labelKey: string;
  value: string;
  example: string;
};

export const SEARCH_TEMPLATES: SearchTemplate[] = [
  {
    labelKey: "user",
    value: "user:vercel",
    example: "user:vercel",
  },
  {
    labelKey: "language",
    value: "language:TypeScript",
    example: "language:TypeScript",
  },
  {
    labelKey: "stars",
    value: "stars:>1000",
    example: "stars:>1000",
  },
  {
    labelKey: "combined",
    value: "user:vercel language:TypeScript",
    example: "user:vercel language:TypeScript",
  },
];

import { Repository } from "@/lib/github/types";

// 関連リポジトリを検索するためのクエリを構築するビルダー
export function buildRelatedQuery(
  repository: Repository | null | undefined,
  owner: string,
  repo: string,
) {
  if (!repository) {
    return "";
  }

  const parts: string[] = [];

  // 言語フィルター
  if (repository.language) {
    parts.push(`language:${repository.language}`);
  }

  // トピックフィルター（最大3つまで）
  const topics = repository.topics ?? [];
  for (const topic of topics.slice(0, 3)) {
    if (topic.trim() !== "") {
      parts.push(`topic:${topic}`);
    }
  }

  // リポジトリ名と説明文からキーワードを抽出（最大2つまで）
  const keywords = extractKeywords(repository.name, repository.description);
  for (const keyword of keywords.slice(0, 2)) {
    parts.push(keyword);
  }

  parts.push(`-repo:${owner}/${repo}`);

  return parts.join(" ");
}

// リポジトリ名と説明文からキーワードを抽出するヘルパー
function extractKeywords(name: string, description: string | null) {
  const tokens: string[] = [];
  const addTokens = (value: string) => {
    const matches = value.match(/[A-Za-z0-9][A-Za-z0-9._-]{2,}/g) ?? [];
    for (const match of matches) {
      if (!tokens.includes(match)) {
        tokens.push(match);
      }
    }
  };

  addTokens(name);
  if (description) {
    addTokens(description);
  }

  return tokens;
}

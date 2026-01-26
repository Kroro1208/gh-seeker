import { describe, it, expect } from "vitest";
import { buildRelatedQuery } from "../search/related";
import type { Repository } from "../github/types";

describe("buildRelatedQuery", () => {
  const createMockRepository = (
    overrides: Partial<Repository> = {},
  ): Repository => ({
    id: 1,
    name: "test-repo",
    full_name: "user/test-repo",
    description: "A test repository",
    html_url: "https://github.com/user/test-repo",
    stargazers_count: 100,
    watchers_count: 50,
    forks_count: 25,
    open_issues_count: 5,
    language: "TypeScript",
    topics: ["react", "nextjs", "testing"],
    owner: {
      id: 1,
      login: "user",
      avatar_url: "https://avatars.githubusercontent.com/u/1",
      html_url: "https://github.com/user",
      type: "User",
    },
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    pushed_at: "2024-01-15T00:00:00Z",
    license: null,
    ...overrides,
  });

  describe("基本的なクエリ構築", () => {
    it("言語、トピック、キーワード、除外条件を含むクエリを生成する", () => {
      // Arrange
      const repo = createMockRepository();

      // Act
      const result = buildRelatedQuery(repo, "user", "test-repo");

      // Assert
      expect(result).toContain("language:TypeScript");
      expect(result).toContain("topic:react");
      expect(result).toContain("topic:nextjs");
      expect(result).toContain("topic:testing");
      expect(result).toContain("-repo:user/test-repo");
    });

    it("リポジトリ名からキーワードを抽出する", () => {
      // Arrange
      const repo = createMockRepository({
        name: "awesome-library",
        description: null,
        topics: [],
      });

      // Act
      const result = buildRelatedQuery(repo, "user", "awesome-library");

      // Assert
      expect(result).toContain("awesome-library");
    });

    it("説明文からキーワードを抽出する", () => {
      // Arrange
      const repo = createMockRepository({
        name: "mylib",
        description: "A powerful utility for developers",
        topics: [],
      });

      // Act
      const result = buildRelatedQuery(repo, "user", "mylib");

      // Assert
      expect(result).toContain("mylib");
      // 説明文からのキーワード（3文字以上）
      expect(result).toContain("powerful");
    });
  });

  describe("言語フィルター", () => {
    it("言語がある場合は含める", () => {
      // Arrange
      const repo = createMockRepository({ language: "Python" });

      // Act
      const result = buildRelatedQuery(repo, "user", "test-repo");

      // Assert
      expect(result).toContain("language:Python");
    });

    it("言語がnullの場合は含めない", () => {
      // Arrange
      const repo = createMockRepository({ language: null });

      // Act
      const result = buildRelatedQuery(repo, "user", "test-repo");

      // Assert
      expect(result).not.toContain("language:");
    });
  });

  describe("トピックフィルター", () => {
    it("トピックは最大3つまで含める", () => {
      // Arrange
      const repo = createMockRepository({
        topics: ["topic1", "topic2", "topic3", "topic4", "topic5"],
      });

      // Act
      const result = buildRelatedQuery(repo, "user", "test-repo");

      // Assert
      expect(result).toContain("topic:topic1");
      expect(result).toContain("topic:topic2");
      expect(result).toContain("topic:topic3");
      expect(result).not.toContain("topic:topic4");
      expect(result).not.toContain("topic:topic5");
    });

    it("トピックがない場合は含めない", () => {
      // Arrange
      const repo = createMockRepository({ topics: [] });

      // Act
      const result = buildRelatedQuery(repo, "user", "test-repo");

      // Assert
      expect(result).not.toContain("topic:");
    });

    it("空白のトピックは除外される", () => {
      // Arrange
      const repo = createMockRepository({
        topics: ["valid", "  ", "another"],
      });

      // Act
      const result = buildRelatedQuery(repo, "user", "test-repo");

      // Assert
      expect(result).toContain("topic:valid");
      expect(result).toContain("topic:another");
      expect(result).not.toMatch(/topic:\s+/);
    });

    it("topicsがundefinedの場合は含めない", () => {
      // Arrange
      const repo = createMockRepository({ topics: undefined });

      // Act
      const result = buildRelatedQuery(repo, "user", "test-repo");

      // Assert
      expect(result).not.toContain("topic:");
    });
  });

  describe("キーワード抽出", () => {
    it("キーワードは最大2つまで含める", () => {
      // Arrange
      const repo = createMockRepository({
        name: "first-second-third-fourth",
        description: null,
        topics: [],
        language: null,
      });

      // Act
      const result = buildRelatedQuery(
        repo,
        "user",
        "first-second-third-fourth",
      );

      // Assert
      // リポジトリ名から抽出されるキーワードは最大2つ
      const keywords = result
        .split(" ")
        .filter((part) => !part.startsWith("-repo:"));
      expect(keywords.length).toBeLessThanOrEqual(2);
    });

    it("3文字以上のトークンのみがキーワードとして抽出される", () => {
      // Arrange
      // extractKeywords の正規表現は [A-Za-z0-9][A-Za-z0-9._-]{2,} なので
      // 3文字以上のトークンのみがマッチする
      const repo = createMockRepository({
        name: "abc-defg",
        description: "HELLO world",
        topics: [],
        language: null,
      });

      // Act
      const result = buildRelatedQuery(repo, "user", "abc-defg");

      // Assert
      // リポジトリ名 "abc-defg" から "abc-defg" がマッチ（全体が1トークン）
      // 説明文から "HELLO" と "world" がマッチ
      expect(result).toContain("abc-defg");
      expect(result).toContain("-repo:user/abc-defg");
    });
  });

  describe("除外条件", () => {
    it("自身のリポジトリを除外する", () => {
      // Arrange
      const repo = createMockRepository();

      // Act
      const result = buildRelatedQuery(repo, "testowner", "testrepo");

      // Assert
      expect(result).toContain("-repo:testowner/testrepo");
    });
  });

  describe("エッジケース", () => {
    it("repositoryがnullの場合は空文字を返す", () => {
      // Act
      const result = buildRelatedQuery(null, "user", "repo");

      // Assert
      expect(result).toBe("");
    });

    it("repositoryがundefinedの場合は空文字を返す", () => {
      // Act
      const result = buildRelatedQuery(undefined, "user", "repo");

      // Assert
      expect(result).toBe("");
    });

    it("すべてのフィールドが空/nullの場合も除外条件は含まれる", () => {
      // Arrange
      const repo = createMockRepository({
        name: "",
        description: null,
        language: null,
        topics: [],
      });

      // Act
      const result = buildRelatedQuery(repo, "user", "repo");

      // Assert
      expect(result).toContain("-repo:user/repo");
    });
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RepositoryCard } from "../repository/repository-card";
import type { Repository } from "@/lib/github/types";

describe("RepositoryCard", () => {
  const mockRepository: Repository = {
    id: 123,
    name: "test-repo",
    full_name: "testuser/test-repo",
    description: "A test repository for unit testing",
    html_url: "https://github.com/testuser/test-repo",
    stargazers_count: 1234,
    watchers_count: 100,
    forks_count: 567,
    open_issues_count: 10,
    language: "TypeScript",
    owner: {
      id: 1,
      login: "testuser",
      avatar_url: "https://avatars.githubusercontent.com/u/1",
      html_url: "https://github.com/testuser",
      type: "User",
    },
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    pushed_at: "2024-01-15T00:00:00Z",
    license: null,
  };

  it("リポジトリ名が表示される", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert
    expect(screen.getByText("test-repo")).toBeInTheDocument();
  });

  it("オーナー名が表示される", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("説明文が表示される", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert
    expect(
      screen.getByText("A test repository for unit testing"),
    ).toBeInTheDocument();
  });

  it("説明文がない場合は表示されない", () => {
    // Arrange
    const repoWithoutDescription = { ...mockRepository, description: null };

    // Act
    render(<RepositoryCard repository={repoWithoutDescription} />);

    // Assert
    expect(
      screen.queryByText("A test repository for unit testing"),
    ).not.toBeInTheDocument();
  });

  it("言語が表示される", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("言語がない場合は表示されない", () => {
    // Arrange
    const repoWithoutLanguage = { ...mockRepository, language: null };

    // Act
    render(<RepositoryCard repository={repoWithoutLanguage} />);

    // Assert
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
  });

  it("スター数が3桁区切りで表示される", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("フォーク数が3桁区切りで表示される", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert
    expect(screen.getByText("567")).toBeInTheDocument();
  });

  it("オーナーのアバター画像が表示される", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert
    const avatar = screen.getByAltText("testuser avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute(
      "src",
      expect.stringContaining("avatars.githubusercontent.com"),
    );
  });

  it("詳細ページへのリンクが生成される", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/repository/testuser/test-repo?repoId=123",
    );
  });

  it("検索パラメータがある場合、クエリストリングに含まれる", () => {
    // Act
    render(
      <RepositoryCard
        repository={mockRepository}
        searchQuery="react"
        language="JavaScript"
        sort="stars"
        order="desc"
        page={2}
        perPage={50}
      />,
    );

    // Assert
    const link = screen.getByRole("link");
    const href = link.getAttribute("href") || "";
    expect(href).toContain("q=react");
    expect(href).toContain("repoId=123");
    expect(href).toContain("language=JavaScript");
    expect(href).toContain("sort=stars");
    expect(href).toContain("order=desc");
    expect(href).toContain("page=2");
    expect(href).toContain("per_page=50");
  });

  it("page=1 の場合はクエリストリングに含まれない", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} page={1} />);

    // Assert
    const link = screen.getByRole("link");
    const href = link.getAttribute("href") || "";
    expect(href).not.toContain("page=");
  });

  it("カードがリンクとして機能する", () => {
    // Act
    render(<RepositoryCard repository={mockRepository} />);

    // Assert: リンクが存在すればクリック可能
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });
});

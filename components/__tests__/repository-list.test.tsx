import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RepositoryList } from "../repository/repository-list";
import type { Repository } from "@/lib/github/types";
import * as useRepositorySearchModule from "@/hooks/use-repository-search";

vi.mock("@/hooks/use-repository-search");

describe("RepositoryList", () => {
  const mockRepository: Repository = {
    id: 1,
    name: "test-repo",
    full_name: "user/test-repo",
    description: "Test repository",
    html_url: "https://github.com/user/test-repo",
    stargazers_count: 100,
    watchers_count: 50,
    forks_count: 25,
    open_issues_count: 5,
    language: "TypeScript",
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
  };

  const createMockState = (
    overrides: Partial<useRepositorySearchModule.RepositorySearchState> = {},
  ): useRepositorySearchModule.RepositorySearchState => ({
    query: "react",
    paginatedItems: [mockRepository],
    filteredItems: [mockRepository],
    pagination: {
      effectivePage: 1,
      totalPages: 1,
      effectiveTotalCount: 1,
      displayedCount: 1,
      apiPage: 1,
      pageSliceStart: 0,
      pageSliceEnd: 30,
    },
    languageOptions: [
      { language: "TypeScript", count: 1 },
      { language: "JavaScript", count: 1 },
    ],
    isLoading: false,
    isFetching: false,
    error: null,
    hasQuery: true,
    hasResults: true,
    isLanguageFilterActive: false,
    normalizedSort: undefined,
    normalizedOrder: "desc",
    normalizedPerPage: 30,
    language: "",
    resultsRef: { current: null },
    ...overrides,
  });

  const createMockHandlers =
    (): useRepositorySearchModule.RepositorySearchHandlers => ({
      onPageChange: vi.fn(),
      onLanguageChange: vi.fn(),
      onSortChange: vi.fn(),
      onPerPageChange: vi.fn(),
      refetch: vi.fn(),
    });

  beforeEach(() => {
    vi.clearAllMocks();
    // scrollIntoView のモック
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("クエリがない場合は何も表示しない", () => {
    // Arrange
    const mockState = createMockState({ hasQuery: false });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    const { container } = render(<RepositoryList />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("ローディング中はスケルトンを表示する", () => {
    // Arrange
    const mockState = createMockState({ isLoading: true });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert
    // スケルトンの特徴的な要素を確認
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("エラー時はエラーメッセージと再試行ボタンを表示する", () => {
    // Arrange: 通常のErrorは再試行可能
    const mockError = new Error("Unexpected error");
    const mockState = createMockState({ error: mockError });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert: getErrorPresentation の実際の出力に基づく
    expect(screen.getByText("エラーが発生しました。")).toBeInTheDocument();
    expect(screen.getByText("Unexpected error")).toBeInTheDocument();
    expect(screen.getByText("再試行")).toBeInTheDocument();
  });

  it("再試行ボタンをクリックすると refetch が呼ばれる", async () => {
    // Arrange
    const mockError = new Error("Network error");
    const mockState = createMockState({ error: mockError });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    const user = userEvent.setup();
    render(<RepositoryList />);

    // Act
    await user.click(screen.getByText("再試行"));

    // Assert
    expect(mockHandlers.refetch).toHaveBeenCalledTimes(1);
  });

  it("検索結果が0件の場合はメッセージを表示する", () => {
    // Arrange
    const mockState = createMockState({
      hasResults: false,
      paginatedItems: [],
      filteredItems: [],
    });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert
    expect(
      screen.getByText("該当するリポジトリが見つかりませんでした"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("別のキーワードで検索してみてください"),
    ).toBeInTheDocument();
  });

  it("フィルター後に0件の場合は別のメッセージを表示する", () => {
    // Arrange
    const mockState = createMockState({
      hasResults: true,
      filteredItems: [],
      paginatedItems: [],
    });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert
    expect(
      screen.getByText("該当するリポジトリが見つかりませんでした"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("言語フィルターを変更してみてください"),
    ).toBeInTheDocument();
  });

  it("検索結果がある場合はリポジトリカードを表示する", () => {
    // Arrange
    const mockState = createMockState();
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert
    expect(screen.getByText("test-repo")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("Test repository")).toBeInTheDocument();
  });

  it("複数のリポジトリが表示される", () => {
    // Arrange
    const mockRepos = [
      mockRepository,
      { ...mockRepository, id: 2, name: "another-repo" },
      { ...mockRepository, id: 3, name: "third-repo" },
    ];

    const mockState = createMockState({
      paginatedItems: mockRepos,
      filteredItems: mockRepos,
    });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert
    expect(screen.getByText("test-repo")).toBeInTheDocument();
    expect(screen.getByText("another-repo")).toBeInTheDocument();
    expect(screen.getByText("third-repo")).toBeInTheDocument();
  });

  it("ページネーションが表示される（totalPages > 1の場合）", () => {
    // Arrange
    const mockState = createMockState({
      pagination: {
        effectivePage: 1,
        totalPages: 5,
        effectiveTotalCount: 150,
        displayedCount: 30,
        apiPage: 1,
        pageSliceStart: 0,
        pageSliceEnd: 30,
      },
    });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert
    const prevButtons = screen.getAllByText("前へ");
    const nextButtons = screen.getAllByText("次へ");
    expect(prevButtons.length).toBeGreaterThan(0);
    expect(nextButtons.length).toBeGreaterThan(0);
  });

  it("RepositoryListControls が表示される", () => {
    // Arrange
    const mockState = createMockState();
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert
    expect(screen.getByLabelText("言語フィルター")).toBeInTheDocument();
    expect(screen.getByLabelText("ソート")).toBeInTheDocument();
    expect(
      screen.getByLabelText("1ページあたりの表示件数"),
    ).toBeInTheDocument();
  });

  it("表示件数が表示される", () => {
    // Arrange
    const mockState = createMockState({
      pagination: {
        effectivePage: 1,
        totalPages: 1,
        effectiveTotalCount: 1,
        displayedCount: 1,
        apiPage: 1,
        pageSliceStart: 0,
        pageSliceEnd: 1,
      },
    });
    const mockHandlers = createMockHandlers();

    vi.mocked(useRepositorySearchModule.useRepositorySearch).mockReturnValue({
      state: mockState,
      handlers: mockHandlers,
    });

    // Act
    render(<RepositoryList />);

    // Assert
    expect(screen.getByText("1 件表示 / 1 件")).toBeInTheDocument();
  });
});

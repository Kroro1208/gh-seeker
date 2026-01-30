import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { NextIntlClientProvider } from "next-intl";
import { RepositoryList } from "../repository/repository-list";
import type {
  Repository,
  SearchRepositoriesResponse,
} from "@/lib/github/types";
import jaMessages from "@/lib/i18n/locales/ja.json";

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

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });

const renderWithProviders = (searchParams: string) => {
  const queryClient = createQueryClient();

  const renderResult = render(
    <NextIntlClientProvider locale="ja" messages={jaMessages}>
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter searchParams={searchParams}>
          <RepositoryList />
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );

  return { queryClient, ...renderResult };
};

const createSearchResponse = (
  items: Repository[],
  totalCount = items.length,
): SearchRepositoriesResponse => ({
  total_count: totalCount,
  incomplete_results: false,
  items,
});

const createJsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("RepositoryList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("クエリがない場合は何も表示しない", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { container } = renderWithProviders("");

    expect(container.firstChild).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ローディング中はスケルトンを表示する", () => {
    const fetchMock = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react");

    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("エラー時はエラーメッセージと再試行ボタンを表示する", async () => {
    const fetchMock = vi.fn((url: RequestInfo | URL) => {
      const urlString = url.toString();
      if (urlString.includes("sort=")) {
        return Promise.resolve(
          createJsonResponse(createSearchResponse([mockRepository])),
        );
      }
      return Promise.resolve(
        createJsonResponse({ message: "Unexpected error" }, 500),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react");

    expect(
      await screen.findByText("APIエラーが発生しました。"),
    ).toBeInTheDocument();
    expect(screen.getByText("Unexpected error")).toBeInTheDocument();
    expect(screen.getByText("再試行")).toBeInTheDocument();
  });

  it("再試行ボタンをクリックするとAPIが再実行される", async () => {
    const fetchMock = vi.fn((url: RequestInfo | URL) => {
      const urlString = url.toString();
      if (urlString.includes("sort=")) {
        return Promise.resolve(
          createJsonResponse(createSearchResponse([mockRepository])),
        );
      }
      return Promise.resolve(
        createJsonResponse({ message: "Unexpected error" }, 500),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders("?q=react");

    await screen.findByText("APIエラーが発生しました。");
    const initialCalls = fetchMock.mock.calls.length;

    await user.click(screen.getByText("再試行"));

    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThan(initialCalls),
    );
  });

  it("検索結果が0件の場合はメッセージを表示する", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(createJsonResponse(createSearchResponse([]))),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react");

    expect(
      await screen.findByText("該当するリポジトリが見つかりませんでした"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("別のキーワードで検索してみてください"),
    ).toBeInTheDocument();
  });

  it("フィルター後に0件の場合は別のメッセージを表示する", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        createJsonResponse(createSearchResponse([mockRepository])),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react&language=Rust");

    expect(
      await screen.findByText("該当するリポジトリが見つかりませんでした"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("言語フィルターを変更してみてください"),
    ).toBeInTheDocument();
  });

  it("検索結果がある場合はリポジトリカードを表示する", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        createJsonResponse(createSearchResponse([mockRepository])),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react");

    expect(await screen.findByText("test-repo")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("Test repository")).toBeInTheDocument();
  });

  it("複数のリポジトリが表示される", async () => {
    const mockRepos = [
      mockRepository,
      { ...mockRepository, id: 2, name: "another-repo" },
      { ...mockRepository, id: 3, name: "third-repo" },
    ];

    const fetchMock = vi.fn(() =>
      Promise.resolve(createJsonResponse(createSearchResponse(mockRepos))),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react");

    expect(await screen.findByText("test-repo")).toBeInTheDocument();
    expect(screen.getByText("another-repo")).toBeInTheDocument();
    expect(screen.getByText("third-repo")).toBeInTheDocument();
  });

  it("ページネーションが表示される（totalPages > 1の場合）", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        createJsonResponse(createSearchResponse([mockRepository], 200)),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react");

    await screen.findByText("test-repo");
    const prevButtons = screen.getAllByText("前へ");
    const nextButtons = screen.getAllByText("次へ");
    expect(prevButtons.length).toBeGreaterThan(0);
    expect(nextButtons.length).toBeGreaterThan(0);
  });

  it("RepositoryListControls が表示される", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        createJsonResponse(createSearchResponse([mockRepository])),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react");

    await screen.findByText("test-repo");
    expect(screen.getByLabelText("言語フィルター")).toBeInTheDocument();
    expect(screen.getByLabelText("ソート")).toBeInTheDocument();
    expect(
      screen.getByLabelText("1ページあたりの表示件数"),
    ).toBeInTheDocument();
  });

  it("表示件数が表示される", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        createJsonResponse(createSearchResponse([mockRepository])),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders("?q=react");

    expect(await screen.findByText("1 件表示 / 1 件")).toBeInTheDocument();
  });
});

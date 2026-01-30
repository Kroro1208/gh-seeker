import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GitHubTokenInput } from "../github/github-token-input";
import { IntlWrapper } from "@/test-utils/intl-wrapper";

const renderWithIntl = (ui: React.ReactElement) =>
  render(<IntlWrapper>{ui}</IntlWrapper>);

// fetch をモック（システム境界）
const mockFetch = vi.fn();

describe("GitHubTokenInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("トークン未設定時", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ hasToken: false }),
      });
    });

    it("入力欄と保存ボタンが表示される", async () => {
      // Act
      renderWithIntl(<GitHubTokenInput />);

      // Assert: 観察可能なUIを検証
      await waitFor(() => {
        expect(
          screen.getByLabelText("GitHub Personal Access Token"),
        ).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    });

    it("入力欄はパスワード型でプレースホルダーがある", async () => {
      // Act
      renderWithIntl(<GitHubTokenInput />);

      // Assert
      await waitFor(() => {
        const input = screen.getByLabelText("GitHub Personal Access Token");
        expect(input).toHaveAttribute("type", "password");
        expect(input).toHaveAttribute("placeholder", "ghp_...");
      });
    });

    it("空欄では保存ボタンが無効、入力すると有効になる", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithIntl(<GitHubTokenInput />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("GitHub Personal Access Token"),
        ).toBeInTheDocument();
      });

      // Assert: 空欄では無効
      const button = screen.getByRole("button", { name: "保存" });
      expect(button).toBeDisabled();

      // Act: 入力
      const input = screen.getByLabelText("GitHub Personal Access Token");
      await user.type(input, "ghp_test");

      // Assert: 有効になる
      expect(button).not.toBeDisabled();
    });

    it("保存成功後に設定済み表示になる", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasToken: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      renderWithIntl(<GitHubTokenInput />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("GitHub Personal Access Token"),
        ).toBeInTheDocument();
      });

      const input = screen.getByLabelText("GitHub Personal Access Token");
      await user.type(input, "ghp_test123456789012345678901234567890");

      // Act
      const button = screen.getByRole("button", { name: "保存" });
      await user.click(button);

      // Assert: 観察可能な結果（DOMの変化）を検証
      await waitFor(() => {
        expect(screen.getByText("設定済み")).toBeInTheDocument();
      });
      expect(screen.getByText("クリア")).toBeInTheDocument();
    });

    it("Enterキーで保存できる", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasToken: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      renderWithIntl(<GitHubTokenInput />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("GitHub Personal Access Token"),
        ).toBeInTheDocument();
      });

      const input = screen.getByLabelText("GitHub Personal Access Token");
      await user.type(input, "ghp_test123456789012345678901234567890");

      // Act
      await user.keyboard("{Enter}");

      // Assert: 設定済みになる
      await waitFor(() => {
        expect(screen.getByText("設定済み")).toBeInTheDocument();
      });
    });

    it("保存失敗時にエラーメッセージが表示される", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasToken: false }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Invalid token" }),
        });

      renderWithIntl(<GitHubTokenInput />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("GitHub Personal Access Token"),
        ).toBeInTheDocument();
      });

      const input = screen.getByLabelText("GitHub Personal Access Token");
      await user.type(input, "invalid_token");

      const button = screen.getByRole("button", { name: "保存" });
      await user.click(button);

      // Assert: エラーメッセージが表示される
      await waitFor(() => {
        expect(screen.getByText(/保存に失敗しました/)).toBeInTheDocument();
      });
      // 入力欄は残る（設定済みにならない）
      expect(
        screen.getByLabelText("GitHub Personal Access Token"),
      ).toBeInTheDocument();
    });
  });

  describe("トークン設定済み時", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ hasToken: true }),
      });
    });

    it("設定済み表示とクリアボタンが表示され、入力欄は非表示", async () => {
      // Act
      renderWithIntl(<GitHubTokenInput />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("設定済み")).toBeInTheDocument();
      });
      expect(screen.getByText("クリア")).toBeInTheDocument();
      expect(
        screen.queryByLabelText("GitHub Personal Access Token"),
      ).not.toBeInTheDocument();
    });

    it("クリア後に入力欄が表示される", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasToken: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      renderWithIntl(<GitHubTokenInput />);

      await waitFor(() => {
        expect(screen.getByText("クリア")).toBeInTheDocument();
      });

      // Act
      const clearButton = screen.getByText("クリア");
      await user.click(clearButton);

      // Assert: 入力欄が再表示される
      await waitFor(() => {
        expect(
          screen.getByLabelText("GitHub Personal Access Token"),
        ).toBeInTheDocument();
      });
      expect(screen.queryByText("設定済み")).not.toBeInTheDocument();
    });
  });

  it("className が適用される", async () => {
    // Arrange
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ hasToken: false }),
    });

    // Act
    const { container } = renderWithIntl(
      <GitHubTokenInput className="custom-class" />,
    );

    // Assert: ローディング完了を待ってからクラス確認
    await waitFor(() => {
      expect(
        screen.getByLabelText("GitHub Personal Access Token"),
      ).toBeInTheDocument();
    });
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

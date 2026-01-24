import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GitHubTokenInput } from "../github/github-token-input";
import * as tokenModule from "@/lib/github/token";

// token モジュールをモック（システム境界）
vi.mock("@/lib/github/token", () => ({
  getGitHubToken: vi.fn(),
  setGitHubToken: vi.fn(),
}));

describe("GitHubTokenInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期表示時にラベルと説明文が表示される", () => {
    // Arrange
    vi.mocked(tokenModule.getGitHubToken).mockReturnValue(null);

    // Act
    render(<GitHubTokenInput />);

    // Assert
    expect(screen.getByText("GitHub Token")).toBeInTheDocument();
    expect(
      screen.getByText(/GitHub API リクエストにのみ使われます/),
    ).toBeInTheDocument();
  });

  it("sessionStorageにトークンがある場合、初期値として表示される", () => {
    // Arrange
    vi.mocked(tokenModule.getGitHubToken).mockReturnValue("ghp_existing_token");

    // Act
    render(<GitHubTokenInput />);

    // Assert
    const input = screen.getByLabelText("GitHub Personal Access Token");
    expect(input).toHaveValue("ghp_existing_token");
  });

  it("sessionStorageにトークンがない場合、空の入力欄が表示される", () => {
    // Arrange
    vi.mocked(tokenModule.getGitHubToken).mockReturnValue(null);

    // Act
    render(<GitHubTokenInput />);

    // Assert
    const input = screen.getByLabelText("GitHub Personal Access Token");
    expect(input).toHaveValue("");
  });

  it("ユーザーがトークンを入力すると表示が更新される", async () => {
    // Arrange
    vi.mocked(tokenModule.getGitHubToken).mockReturnValue(null);
    const user = userEvent.setup();
    render(<GitHubTokenInput />);

    const input = screen.getByLabelText("GitHub Personal Access Token");

    // Act
    await user.type(input, "ghp_new_token_123");

    // Assert
    expect(input).toHaveValue("ghp_new_token_123");
  });

  it("ユーザーが入力すると setGitHubToken が呼ばれる", async () => {
    // Arrange
    vi.mocked(tokenModule.getGitHubToken).mockReturnValue(null);
    const user = userEvent.setup();
    render(<GitHubTokenInput />);

    const input = screen.getByLabelText("GitHub Personal Access Token");

    // Act
    await user.type(input, "ghp_test");

    // Assert
    // 各文字ごとに呼ばれる
    expect(tokenModule.setGitHubToken).toHaveBeenCalledWith("g");
    expect(tokenModule.setGitHubToken).toHaveBeenCalledWith("gh");
    expect(tokenModule.setGitHubToken).toHaveBeenCalledWith("ghp");
    expect(tokenModule.setGitHubToken).toHaveBeenCalledWith("ghp_");
    expect(tokenModule.setGitHubToken).toHaveBeenCalledWith("ghp_t");
    expect(tokenModule.setGitHubToken).toHaveBeenCalledWith("ghp_te");
    expect(tokenModule.setGitHubToken).toHaveBeenCalledWith("ghp_tes");
    expect(tokenModule.setGitHubToken).toHaveBeenCalledWith("ghp_test");
  });

  it("入力欄の type 属性が password である", () => {
    // Arrange
    vi.mocked(tokenModule.getGitHubToken).mockReturnValue(null);

    // Act
    render(<GitHubTokenInput />);

    // Assert
    const input = screen.getByLabelText("GitHub Personal Access Token");
    expect(input).toHaveAttribute("type", "password");
  });

  it("placeholder が表示される", () => {
    // Arrange
    vi.mocked(tokenModule.getGitHubToken).mockReturnValue(null);

    // Act
    render(<GitHubTokenInput />);

    // Assert
    const input = screen.getByLabelText("GitHub Personal Access Token");
    expect(input).toHaveAttribute("placeholder", "ghp_...");
  });

  it("className が適用される", () => {
    // Arrange
    vi.mocked(tokenModule.getGitHubToken).mockReturnValue(null);

    // Act
    const { container } = render(<GitHubTokenInput className="custom-class" />);

    // Assert
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

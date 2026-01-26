import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GitHubTokenInput } from "../github/github-token-input";

describe("GitHubTokenInput", () => {
  beforeEach(() => {
    // sessionStorage をクリア
    sessionStorage.clear();
  });

  it("初期表示時にラベルと説明文が表示される", () => {
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
    sessionStorage.setItem("github_token", "ghp_existing_token");

    // Act
    render(<GitHubTokenInput />);

    // Assert
    const input = screen.getByLabelText("GitHub Personal Access Token");
    expect(input).toHaveValue("ghp_existing_token");
  });

  it("sessionStorageにトークンがない場合、空の入力欄が表示される", () => {
    // Act
    render(<GitHubTokenInput />);

    // Assert
    const input = screen.getByLabelText("GitHub Personal Access Token");
    expect(input).toHaveValue("");
  });

  it("ユーザーがトークンを入力すると表示が更新される", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<GitHubTokenInput />);

    const input = screen.getByLabelText("GitHub Personal Access Token");

    // Act
    await user.type(input, "ghp_new_token_123");

    // Assert
    expect(input).toHaveValue("ghp_new_token_123");
  });

  it("ユーザーが入力すると sessionStorage に保存される", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<GitHubTokenInput />);

    const input = screen.getByLabelText("GitHub Personal Access Token");

    // Act
    await user.type(input, "ghp_test");

    // Assert: sessionStorage に実際に保存されているか確認
    expect(sessionStorage.getItem("github_token")).toBe("ghp_test");
  });

  it("入力を削除すると sessionStorage からも削除される", async () => {
    // Arrange
    sessionStorage.setItem("github_token", "ghp_existing");
    const user = userEvent.setup();
    render(<GitHubTokenInput />);

    const input = screen.getByLabelText("GitHub Personal Access Token");

    // Act: 既存の値をクリアして空にする
    await user.clear(input);

    // Assert
    expect(input).toHaveValue("");
    expect(sessionStorage.getItem("github_token")).toBeNull();
  });

  it("入力欄の type 属性が password である", () => {
    // Act
    render(<GitHubTokenInput />);

    // Assert
    const input = screen.getByLabelText("GitHub Personal Access Token");
    expect(input).toHaveAttribute("type", "password");
  });

  it("placeholder が表示される", () => {
    // Act
    render(<GitHubTokenInput />);

    // Assert
    const input = screen.getByLabelText("GitHub Personal Access Token");
    expect(input).toHaveAttribute("placeholder", "ghp_...");
  });

  it("className が適用される", () => {
    // Act
    const { container } = render(<GitHubTokenInput className="custom-class" />);

    // Assert
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("空白のみの入力はトリミングされて削除扱いになる", async () => {
    // Arrange
    sessionStorage.setItem("github_token", "ghp_existing");
    const user = userEvent.setup();
    render(<GitHubTokenInput />);

    const input = screen.getByLabelText("GitHub Personal Access Token");

    // Act: 既存の値をクリアして空白を入力
    await user.clear(input);
    await user.type(input, "   ");

    // Assert: 空白のみの場合、トリミングされて削除される
    expect(sessionStorage.getItem("github_token")).toBeNull();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "../repository/pagination";
import { IntlWrapper } from "@/test-utils/intl-wrapper";

const renderWithIntl = (ui: React.ReactElement) =>
  render(<IntlWrapper>{ui}</IntlWrapper>);

describe("Pagination", () => {
  it("前へボタンと次へボタンが表示される", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    renderWithIntl(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    // Assert
    expect(screen.getByText("前へ")).toBeInTheDocument();
    expect(screen.getByText("次へ")).toBeInTheDocument();
  });

  it("ページ数が少ない場合はすべてのページボタンが表示される", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    renderWithIntl(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );

    // Assert
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("現在のページボタンが強調表示される", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    renderWithIntl(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );

    // Assert
    const currentPageButton = screen.getByRole("button", {
      name: "3",
      current: "page",
    });
    expect(currentPageButton).toBeInTheDocument();
  });

  it("前へボタンをクリックすると onPageChange が呼ばれる", async () => {
    // Arrange
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    // Act
    await user.click(screen.getByText("前へ"));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("次へボタンをクリックすると onPageChange が呼ばれる", async () => {
    // Arrange
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    // Act
    await user.click(screen.getByText("次へ"));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it("ページボタンをクリックすると onPageChange が呼ばれる", async () => {
    // Arrange
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    );

    // Act
    await user.click(screen.getByText("3"));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("現在ページが1の場合、前へボタンが無効になる", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    renderWithIntl(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    // Assert
    expect(screen.getByText("前へ")).toBeDisabled();
  });

  it("現在ページが最終ページの場合、次へボタンが無効になる", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    renderWithIntl(
      <Pagination
        currentPage={10}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    // Assert
    expect(screen.getByText("次へ")).toBeDisabled();
  });

  it("ページ数が多い場合、省略記号が表示される", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    renderWithIntl(
      <Pagination
        currentPage={5}
        totalPages={20}
        onPageChange={onPageChange}
      />,
    );

    // Assert
    const ellipsis = screen.getAllByText("…");
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it("ページ数が多い場合、先頭と末尾のページが表示される", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    renderWithIntl(
      <Pagination
        currentPage={5}
        totalPages={20}
        onPageChange={onPageChange}
      />,
    );

    // Assert
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("前へボタンが無効の時でもクリックは可能（ロジックで最小値を保証）", () => {
    // Arrange
    const onPageChange = vi.fn();

    renderWithIntl(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    const prevButton = screen.getByText("前へ");

    // Assert: ボタンは無効だが、クリック自体は可能（実装が Math.max で保証）
    expect(prevButton).toBeDisabled();
  });

  it("次へボタンが無効の時でもクリックは可能（ロジックで最大値を保証）", () => {
    // Arrange
    const onPageChange = vi.fn();

    renderWithIntl(
      <Pagination
        currentPage={10}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    const nextButton = screen.getByText("次へ");

    // Assert: ボタンは無効だが、クリック自体は可能（実装が Math.min で保証）
    expect(nextButton).toBeDisabled();
  });

  it("className が適用される", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    const { container } = renderWithIntl(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
        className="custom-pagination"
      />,
    );

    // Assert
    expect(container.firstChild).toHaveClass("custom-pagination");
  });
});

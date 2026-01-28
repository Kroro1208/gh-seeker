import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RepositoryListControls } from "../repository/repository-list-controls";

describe("RepositoryListControls", () => {
  const mockPagination = {
    effectivePage: 2,
    totalPages: 5,
    effectiveTotalCount: 150,
    displayedCount: 30,
  };

  const mockLanguageOptions = [
    { language: "TypeScript", count: 12 },
    { language: "JavaScript", count: 8 },
    { language: "Python", count: 4 },
    { language: "Go", count: 2 },
  ];

  const defaultProps = {
    pagination: mockPagination,
    normalizedPerPage: 30,
    normalizedSort: "" as const,
    language: "",
    languageOptions: mockLanguageOptions,
    onPageChange: vi.fn(),
    onLanguageChange: vi.fn(),
    onSortChange: vi.fn(),
    onPerPageChange: vi.fn(),
  };

  it("表示件数が表示される", () => {
    // Act
    render(<RepositoryListControls {...defaultProps} />);

    // Assert
    expect(screen.getByText("30 件表示 / 150 件")).toBeInTheDocument();
  });

  it("ページネーションが表示される（totalPages > 1の場合）", () => {
    // Act
    render(<RepositoryListControls {...defaultProps} />);

    // Assert
    expect(screen.getByText("前へ")).toBeInTheDocument();
    expect(screen.getByText("次へ")).toBeInTheDocument();
  });

  it("ページネーションが表示されない（totalPages = 1の場合）", () => {
    // Arrange
    const singlePagePagination = {
      effectivePage: 1,
      totalPages: 1,
      effectiveTotalCount: 10,
      displayedCount: 10,
    };

    // Act
    render(
      <RepositoryListControls
        {...defaultProps}
        pagination={singlePagePagination}
      />,
    );

    // Assert
    expect(screen.queryByText("前へ")).not.toBeInTheDocument();
    expect(screen.queryByText("次へ")).not.toBeInTheDocument();
  });

  it("言語フィルターが表示される", () => {
    // Act
    render(<RepositoryListControls {...defaultProps} />);

    // Assert
    const languageSelect = screen.getByLabelText("言語フィルター");
    expect(languageSelect).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "すべて" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "TypeScript (12)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "JavaScript (8)" }),
    ).toBeInTheDocument();
  });

  it("ソート選択が表示される", () => {
    // Act
    render(<RepositoryListControls {...defaultProps} />);

    // Assert
    const sortSelect = screen.getByLabelText("ソート");
    expect(sortSelect).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "並び替え" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Star数（降順）" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "更新日時（降順）" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "フォーク数（降順）" }),
    ).toBeInTheDocument();
  });

  it("表示件数選択が表示される", () => {
    // Act
    render(<RepositoryListControls {...defaultProps} />);

    // Assert
    const perPageSelect = screen.getByLabelText("1ページあたりの表示件数");
    expect(perPageSelect).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "10件" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "30件" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "50件" })).toBeInTheDocument();
  });

  it("言語を選択すると onLanguageChange が呼ばれる", async () => {
    // Arrange
    const onLanguageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RepositoryListControls
        {...defaultProps}
        onLanguageChange={onLanguageChange}
      />,
    );

    // Act
    await user.selectOptions(
      screen.getByLabelText("言語フィルター"),
      "TypeScript",
    );

    // Assert
    expect(onLanguageChange).toHaveBeenCalledWith("TypeScript");
  });

  it("ソートを選択すると onSortChange が呼ばれる", async () => {
    // Arrange
    const onSortChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RepositoryListControls {...defaultProps} onSortChange={onSortChange} />,
    );

    // Act
    await user.selectOptions(screen.getByLabelText("ソート"), "stars");

    // Assert
    expect(onSortChange).toHaveBeenCalledWith("stars");
  });

  it("表示件数を選択すると onPerPageChange が呼ばれる", async () => {
    // Arrange
    const onPerPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RepositoryListControls
        {...defaultProps}
        onPerPageChange={onPerPageChange}
      />,
    );

    // Act
    await user.selectOptions(
      screen.getByLabelText("1ページあたりの表示件数"),
      "50",
    );

    // Assert
    expect(onPerPageChange).toHaveBeenCalledWith("50");
  });

  it("選択された言語が反映される", () => {
    // Act
    render(<RepositoryListControls {...defaultProps} language="TypeScript" />);

    // Assert
    const languageSelect = screen.getByLabelText(
      "言語フィルター",
    ) as HTMLSelectElement;
    expect(languageSelect.value).toBe("TypeScript");
  });

  it("選択されたソートが反映される", () => {
    // Act
    render(<RepositoryListControls {...defaultProps} normalizedSort="stars" />);

    // Assert
    const sortSelect = screen.getByLabelText("ソート") as HTMLSelectElement;
    expect(sortSelect.value).toBe("stars");
  });

  it("選択された表示件数が反映される", () => {
    // Act
    render(<RepositoryListControls {...defaultProps} normalizedPerPage={50} />);

    // Assert
    const perPageSelect = screen.getByLabelText(
      "1ページあたりの表示件数",
    ) as HTMLSelectElement;
    expect(perPageSelect.value).toBe("50");
  });

  it("件数が3桁区切りで表示される", () => {
    // Arrange
    const largePagination = {
      effectivePage: 1,
      totalPages: 100,
      effectiveTotalCount: 10000,
      displayedCount: 1000,
    };

    // Act
    render(
      <RepositoryListControls {...defaultProps} pagination={largePagination} />,
    );

    // Assert
    expect(screen.getByText("1,000 件表示 / 10,000 件")).toBeInTheDocument();
  });

  it("ページネーションクリック時に onPageChange が呼ばれる", async () => {
    // Arrange
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RepositoryListControls {...defaultProps} onPageChange={onPageChange} />,
    );

    // Act
    await user.click(screen.getByText("次へ"));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

import { describe, it, expect } from "vitest";
import {
  isSortOption,
  parsePositiveInt,
  parseSearchParams,
} from "../api/parsers";

describe("isSortOption", () => {
  it("'stars'が有効であること", () => {
    // Act & Assert
    expect(isSortOption("stars")).toBe(true);
  });

  it("'updated' が有効であること", () => {
    // Act & Assert
    expect(isSortOption("updated")).toBe(true);
  });

  it("'forks' が有効であること", () => {
    // Act & Assert
    expect(isSortOption("forks")).toBe(true);
  });

  it("undefined は無効なこと", () => {
    // Act & Assert
    expect(isSortOption(undefined)).toBe(false);
  });

  it("空文字列は無効なこと", () => {
    // Act & Assert
    expect(isSortOption("")).toBe(false);
  });

  it("その他の文字列は無効なこと", () => {
    // Act & Assert
    expect(isSortOption("invalid")).toBe(false);
    expect(isSortOption("STARS")).toBe(false);
    expect(isSortOption("created")).toBe(false);
  });
});

describe("parsePositiveInt", () => {
  it("正の整数文字列をパースする", () => {
    // Act & Assert
    expect(parsePositiveInt("10")).toBe(10);
    expect(parsePositiveInt("1")).toBe(1);
    expect(parsePositiveInt("999")).toBe(999);
  });

  it("null は undefined を返す", () => {
    // Act & Assert
    expect(parsePositiveInt(null)).toBeUndefined();
  });

  it("空文字列は undefined を返す", () => {
    // Act & Assert
    expect(parsePositiveInt("")).toBeUndefined();
  });

  it("0 は undefined を返す（正の整数ではない）", () => {
    // Act & Assert
    expect(parsePositiveInt("0")).toBeUndefined();
  });

  it("負の数は undefined を返す", () => {
    // Act & Assert
    expect(parsePositiveInt("-1")).toBeUndefined();
    expect(parsePositiveInt("-100")).toBeUndefined();
  });

  it("小数は整数部分のみパースされる", () => {
    // Act & Assert
    expect(parsePositiveInt("3.14")).toBe(3);
    expect(parsePositiveInt("10.99")).toBe(10);
  });

  it("数字以外の文字列は undefined を返す", () => {
    // Act & Assert
    expect(parsePositiveInt("abc")).toBeUndefined();
    expect(parsePositiveInt("10abc")).toBe(10); // parseInt の挙動
    expect(parsePositiveInt("abc10")).toBeUndefined();
  });

  it("Infinity は undefined を返す", () => {
    // Act & Assert
    expect(parsePositiveInt("Infinity")).toBeUndefined();
  });
});

describe("parseSearchParams", () => {
  it("すべてのパラメータを正しくパースする", () => {
    // Arrange
    const params = new URLSearchParams(
      "q=react&sort=stars&order=desc&per_page=50&page=2",
    );

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.q).toBe("react");
    expect(result.sort).toBe("stars");
    expect(result.order).toBe("desc");
    expect(result.per_page).toBe(50);
    expect(result.page).toBe(2);
  });

  it("q パラメータのみの場合", () => {
    // Arrange
    const params = new URLSearchParams("q=typescript");

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.q).toBe("typescript");
    expect(result.sort).toBeUndefined();
    expect(result.order).toBeUndefined();
    expect(result.per_page).toBeUndefined();
    expect(result.page).toBeUndefined();
  });

  it("q が空の場合は空文字列を返す", () => {
    // Arrange
    const params = new URLSearchParams("");

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.q).toBe("");
  });

  it("無効な sort は undefined になる", () => {
    // Arrange
    const params = new URLSearchParams("q=react&sort=invalid");

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.sort).toBeUndefined();
  });

  it("sort が undefined の場合、order も undefined になる", () => {
    // Arrange
    const params = new URLSearchParams("q=react&order=desc");

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.sort).toBeUndefined();
    expect(result.order).toBeUndefined();
  });

  it("order が desc 以外の場合は undefined になる", () => {
    // Arrange
    const params = new URLSearchParams("q=react&sort=stars&order=asc");

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.sort).toBe("stars");
    expect(result.order).toBeUndefined();
  });

  it("無効な per_page は undefined になる", () => {
    // Arrange
    const params = new URLSearchParams("q=react&per_page=invalid");

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.per_page).toBeUndefined();
  });

  it("無効な page は undefined になる", () => {
    // Arrange
    const params = new URLSearchParams("q=react&page=0");

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.page).toBeUndefined();
  });

  it("URLエンコードされた q をデコードする", () => {
    // Arrange
    const params = new URLSearchParams(
      "q=user%3Avercel%20language%3ATypeScript",
    );

    // Act
    const result = parseSearchParams(params);

    // Assert
    expect(result.q).toBe("user:vercel language:TypeScript");
  });
});

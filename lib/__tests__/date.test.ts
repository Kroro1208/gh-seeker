import { describe, it, expect } from "vitest";
import { formatDateJa } from "../date";

describe("formatDateJa", () => {
  it("ISO 8601形式の日付を日本語形式でフォーマットする", () => {
    // Arrange
    const dateString = "2024-01-15T00:00:00Z";

    // Act
    const result = formatDateJa(dateString);

    // Assert
    expect(result).toBe("2024年1月15日");
  });

  it("月初の日付をフォーマットする", () => {
    // Arrange
    const dateString = "2024-03-01T12:30:00Z";

    // Act
    const result = formatDateJa(dateString);

    // Assert
    expect(result).toBe("2024年3月1日");
  });

  it("年末の日付をフォーマットする", () => {
    // Arrange
    // UTCで日本時間にするために時差を考慮
    const dateString = "2023-12-31T12:00:00Z";

    // Act
    const result = formatDateJa(dateString);

    // Assert
    expect(result).toBe("2023年12月31日");
  });

  it("うるう年の2月29日をフォーマットする", () => {
    // Arrange
    const dateString = "2024-02-29T00:00:00Z";

    // Act
    const result = formatDateJa(dateString);

    // Assert
    expect(result).toBe("2024年2月29日");
  });

  it("タイムゾーン付きの日付をフォーマットする", () => {
    // Arrange
    const dateString = "2024-06-15T09:00:00+09:00";

    // Act
    const result = formatDateJa(dateString);

    // Assert
    expect(result).toBe("2024年6月15日");
  });
});

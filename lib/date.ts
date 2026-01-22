/**
 * 日付を日本語形式でフォーマットする
 * @param dateString ISO 8601形式の日付文字列
 * @returns フォーマットされた日付文字列（例: 2024年1月15日）
 */
export function formatDateJa(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

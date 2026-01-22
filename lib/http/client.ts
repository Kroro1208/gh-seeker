// HTTPクライアントのインターフェース
// テスト時にモック可能にするため抽象化する
export interface HttpClient {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

// デフォルトのHTTPクライアント実装（ブラウザのfetchを使用）
export const defaultHttpClient: HttpClient = {
  fetch: (url, init) => fetch(url, init),
};

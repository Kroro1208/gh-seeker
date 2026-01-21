# API Flow

ユーザーがクリックしてからレスポンスが表示されるまでの流れ。

## シーケンス図

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant SearchInput as SearchInput<br/>(components/search/)
    participant URL as URL State<br/>(nuqs)
    participant RepoList as RepositoryList<br/>(components/repository/)
    participant Hook as useSearchRepositories<br/>(lib/github/hooks.ts)
    participant RQ as React Query<br/>Cache
    participant Client as client.ts<br/>(lib/github/)
    participant Route as API Route<br/>(app/api/github/search/)
    participant Server as server-client.ts<br/>(lib/github/)
    participant GitHub as GitHub API

    User->>SearchInput: 検索ワード入力 + クリック
    SearchInput->>URL: setQuery(q), setPage("1")
    Note over URL: ?q=react&page=1

    URL-->>RepoList: useQueryState で検知
    RepoList->>Hook: useSearchRepositories(params)
    Hook->>RQ: queryKey確認

    alt キャッシュあり (5分以内)
        RQ-->>Hook: キャッシュデータ返却
        Hook-->>RepoList: data
    else キャッシュなし
        RQ->>Client: searchRepositories(params)
        Client->>Route: GET /api/github/search?q=...
        Route->>Route: parseSearchParams<br/>(バリデーション)
        Route->>Server: searchRepositories(params)
        Server->>GitHub: GET /search/repositories<br/>(Authorization: Bearer token)
        GitHub-->>Server: JSON Response
        Server->>Server: Zod Schema検証
        Server-->>Route: SearchRepositoriesResponse
        Route-->>Client: NextResponse.json(data)
        Client->>Client: Zod Schema検証
        Client-->>RQ: validated data
        RQ->>RQ: キャッシュ保存
        RQ-->>Hook: data
        Hook-->>RepoList: data
    end

    RepoList->>RepoList: language絞り込み<br/>ページネーション計算
    RepoList-->>User: RepositoryCard表示
```

## コンポーネント図

```mermaid
flowchart TB
    subgraph Client["クライアント (Browser)"]
        UI[SearchInput]
        URL[(URL Params<br/>nuqs)]
        List[RepositoryList]
        Hook[useSearchRepositories]
        RQ[(React Query<br/>Cache)]
        ClientAPI[client.ts]
    end

    subgraph Server["サーバー (Next.js)"]
        Route["/api/github/search<br/>route.ts"]
        ServerClient["server-client.ts"]
    end

    subgraph External["外部"]
        GitHub[(GitHub API)]
    end

    UI -->|setQuery| URL
    URL -->|subscribe| List
    List -->|params| Hook
    Hook -->|queryKey| RQ
    RQ -->|fetch| ClientAPI
    ClientAPI -->|GET| Route
    Route -->|call| ServerClient
    ServerClient -->|GITHUB_TOKEN| GitHub

    GitHub -->|JSON| ServerClient
    ServerClient -->|validate| Route
    Route -->|JSON| ClientAPI
    ClientAPI -->|validate| RQ
    RQ -->|cache| Hook
    Hook -->|data| List
    List -->|render| UI

    style RQ fill:#f9f,stroke:#333
    style URL fill:#ff9,stroke:#333
    style GitHub fill:#9ff,stroke:#333
```

## エラーハンドリングフロー

```mermaid
flowchart LR
    subgraph Errors["エラー種別 (lib/github/errors.ts)"]
        GE[GitHubError<br/>基底クラス]
        API[GitHubAPIError<br/>APIエラー]
        NET[GitHubNetworkError<br/>通信エラー]
        VAL[GitHubValidationError<br/>入力エラー]
        FMT[GitHubResponseFormatError<br/>スキーマ不一致]
    end

    GE --> API
    GE --> NET
    GE --> VAL
    GE --> FMT

    API -->|401/403| Auth["認証エラー"]
    API -->|404| NotFound["データなし"]
    API -->|422| Invalid["クエリ不正"]
    API -->|503| Overload["サーバー過負荷"]
    NET -->|retry: true| Retry["リトライ可能"]
    VAL -->|retry: false| NoRetry["リトライ不可"]
```

## 主要ファイル一覧

| レイヤー | ファイル                                    | 役割                      |
| -------- | ------------------------------------------- | ------------------------- |
| UI       | `components/search/search-input.tsx`        | 検索フォーム              |
| UI       | `components/repository/repository-list.tsx` | 結果一覧                  |
| Hooks    | `lib/github/hooks.ts`                       | React Query ラッパー      |
| Client   | `lib/github/client.ts`                      | クライアント側API呼び出し |
| Route    | `app/api/github/search/route.ts`            | APIエンドポイント         |
| Server   | `lib/github/server-client.ts`               | GitHub API呼び出し        |
| Types    | `lib/github/types.ts`                       | Zodスキーマ・型定義       |
| Errors   | `lib/github/errors.ts`                      | エラー型・ハンドリング    |

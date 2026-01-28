class GitHubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubError";
  }
}

class GitHubAPIError extends GitHubError {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }
}

class GitHubNetworkError extends GitHubError {
  constructor(message: string) {
    super(message);
    this.name = "GitHubNetworkError";
  }
}

class GitHubValidationError extends GitHubError {
  constructor(message: string) {
    super(message);
    this.name = "GitHubValidationError";
  }
}

class GitHubResponseFormatError extends GitHubError {
  constructor(
    message: string,
    public response?: unknown,
  ) {
    super(message);
    this.name = "GitHubResponseFormatError";
  }
}

export function getErrorPresentation(error: unknown) {
  const fallback = {
    title: "エラーが発生しました。",
    description: error instanceof Error ? error.message : "不明なエラーです",
    canRetry: true,
  };

  if (error instanceof GitHubValidationError) {
    return {
      title: "入力エラーです。",
      description: error.message,
      canRetry: false,
    };
  }

  if (error instanceof GitHubNetworkError) {
    return {
      title: "ネットワークエラーです。",
      description: "通信状況を確認して再試行してください。",
      canRetry: true,
    };
  }

  if (error instanceof GitHubResponseFormatError) {
    return {
      title: "レスポンス形式が不正です。",
      description: "時間をおいて再試行してください。",
      canRetry: true,
    };
  }

  if (error instanceof GitHubAPIError) {
    if (error.status === 404) {
      return {
        title: "データが見つかりませんでした。",
        description: error.message,
        canRetry: false,
      };
    }
    const canRetry = error.status
      ? error.status >= 500 || error.status === 429
      : true;
    return {
      title: "APIエラーが発生しました。",
      description: error.message,
      canRetry,
    };
  }

  return fallback;
}

export {
  GitHubError,
  GitHubAPIError,
  GitHubNetworkError,
  GitHubValidationError,
  GitHubResponseFormatError,
};

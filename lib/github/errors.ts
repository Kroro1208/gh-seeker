import { match, P } from "ts-pattern";

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

export type ErrorPresentation = {
  titleKey: string;
  descriptionKey?: string;
  descriptionText?: string;
  canRetry: boolean;
};

export function getErrorPresentation(error: unknown): ErrorPresentation {
  const fallback: ErrorPresentation = {
    titleKey: "error.generic",
    descriptionText: error instanceof Error ? error.message : undefined,
    descriptionKey: error instanceof Error ? undefined : "error.unknown",
    canRetry: true,
  };

  return match(error)
    .with(P.instanceOf(GitHubValidationError), (err) => ({
      titleKey: "error.validation",
      descriptionText: err.message,
      canRetry: false,
    }))
    .with(P.instanceOf(GitHubNetworkError), () => ({
      titleKey: "error.network",
      descriptionKey: "error.networkHint",
      canRetry: true,
    }))
    .with(P.instanceOf(GitHubResponseFormatError), () => ({
      titleKey: "error.responseFormat",
      descriptionKey: "error.responseFormatHint",
      canRetry: true,
    }))
    .with(P.instanceOf(GitHubAPIError), (err) => {
      if (err.status === 404) {
        return {
          titleKey: "error.notFound",
          descriptionText: err.message,
          canRetry: false,
        };
      }
      const canRetry = err.status
        ? err.status >= 500 || err.status === 429
        : true;
      return {
        titleKey: "error.api",
        descriptionText: err.message,
        canRetry,
      };
    })
    .otherwise(() => fallback);
}

export {
  GitHubError,
  GitHubAPIError,
  GitHubNetworkError,
  GitHubValidationError,
  GitHubResponseFormatError,
};

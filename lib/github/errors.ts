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

  if (error instanceof GitHubValidationError) {
    return {
      titleKey: "error.validation",
      descriptionText: error.message,
      canRetry: false,
    };
  }

  if (error instanceof GitHubNetworkError) {
    return {
      titleKey: "error.network",
      descriptionKey: "error.networkHint",
      canRetry: true,
    };
  }

  if (error instanceof GitHubResponseFormatError) {
    return {
      titleKey: "error.responseFormat",
      descriptionKey: "error.responseFormatHint",
      canRetry: true,
    };
  }

  if (error instanceof GitHubAPIError) {
    if (error.status === 404) {
      return {
        titleKey: "error.notFound",
        descriptionText: error.message,
        canRetry: false,
      };
    }
    const canRetry = error.status
      ? error.status >= 500 || error.status === 429
      : true;
    return {
      titleKey: "error.api",
      descriptionText: error.message,
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

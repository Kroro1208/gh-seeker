"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const shouldRetry = (failureCount: number, error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: number }).status === 429
    ) {
      return false;
    }

    return failureCount < 1;
  };

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分
            gcTime: 10 * 60 * 1000, // 10分
            retry: shouldRetry,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

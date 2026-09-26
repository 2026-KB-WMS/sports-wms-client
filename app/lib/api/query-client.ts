import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "./client"

/** 서버가 명확히 거절한 요청(4xx)은 재시도해도 결과가 같으므로 다시 보내지 않는다. */
function shouldRetry(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
    return false
  }
  return failureCount < 2
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

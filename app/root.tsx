import { QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"

import type { Route } from "./+types/root"
import { AuthGate } from "~/components/layout/auth-gate"
import { createQueryClient } from "~/lib/api/query-client"
import { CurrentUserProvider } from "~/lib/current-user"
import "./app.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  // 요청(SSR)·사용자마다 캐시가 섞이지 않도록 컴포넌트 안에서 한 번만 생성한다.
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <CurrentUserProvider>
        <AuthGate />
      </CurrentUserProvider>
    </QueryClientProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}

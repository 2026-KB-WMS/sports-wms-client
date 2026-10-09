import { getToken, handleUnauthorized } from "~/lib/auth-token"

import type { ApiResponse, ErrorResponse, FieldError } from "./types"

/**
 * API 서버 주소. 비워 두면 같은 origin으로 요청하고,
 * 개발 환경에서는 vite.config.ts의 proxy가 /api 요청을 백엔드로 넘긴다.
 */
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ""

/** 서버 오류 응답 또는 네트워크 오류를 표현하는 에러. 화면에서는 이 타입만 다루면 된다. */
export class ApiError extends Error {
  readonly statusCode: number
  readonly errorCode: string | null
  readonly fieldErrors: FieldError[]

  constructor(
    statusCode: number,
    message: string,
    errorCode: string | null = null,
    fieldErrors: FieldError[] = []
  ) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.fieldErrors = fieldErrors
  }

  /** 서버에 도달하지 못한 경우 (네트워크 끊김, 서버 다운 등) */
  get isNetworkError() {
    return this.statusCode === 0
  }
}

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

interface RequestOptions {
  query?: QueryParams
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(path: string, query?: QueryParams) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ""}`
}

/** 토큰 없이 호출하는 인증 API. 이 경로의 401은 "토큰 만료"가 아니라 "자격 증명 불일치"다. */
const PUBLIC_AUTH_PATHS = ["/api/v1/auth/login", "/api/v1/auth/signup"]

/** 공통 요청 헤더. 로그인 토큰이 있으면 Authorization을 붙인다. */
function buildHeaders(hasBody: boolean): HeadersInit {
  const token = getToken()
  return {
    Accept: "application/json",
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request<T>(
  method: string,
  path: string,
  { query, body, signal }: RequestOptions = {}
): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: buildHeaders(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    // 요청 취소(AbortError)는 그대로 던져 react-query가 처리하게 한다.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }
    throw new ApiError(0, "서버에 연결할 수 없습니다.", "NETWORK_ERROR")
  }

  const json = await readJson(response)

  if (!response.ok) {
    if (response.status === 401 && !PUBLIC_AUTH_PATHS.includes(path)) {
      handleUnauthorized()
    }
    const error = json as Partial<ErrorResponse> | null
    throw new ApiError(
      error?.statusCode ?? response.status,
      error?.message ?? (response.statusText || "요청에 실패했습니다."),
      error?.errorCode ?? null,
      error?.errors ?? []
    )
  }

  // 성공 응답은 봉투를 벗겨 data만 돌려준다. (본문이 없는 응답은 undefined)
  return (json as ApiResponse<T> | null)?.data as T
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, options),
}

import { apiClient } from "./client"

/** 인증·계정 API (wms-server docs/api/auth.md) */

export type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE"

export interface LoginInput {
  loginId: string
  password: string
}

export interface LoginResult {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: {
    userId: number
    loginId: string
    name: string
    role: "HQ_ADMIN" | "WAREHOUSE_MANAGER" | "STORE_OWNER"
    status: UserStatus
  }
}

export interface MyProfile {
  userId: number
  loginId: string
  name: string
  email: string
  phone: string
  role: LoginResult["user"]["role"]
  status: UserStatus
  lastLoginAt: string | null
}

/** 토큰 없이 호출한다. 아이디·비밀번호 불일치는 401이다. */
export function login(body: LoginInput) {
  return apiClient.post<LoginResult>("/api/v1/auth/login", body)
}

export function getMe() {
  return apiClient.get<MyProfile>("/api/v1/auth/me")
}

export interface SignupInput {
  loginId: string
  password: string
  name: string
  email: string
  phone: string
  role: "WAREHOUSE_MANAGER" | "STORE_OWNER"
}

/** 토큰 없이 호출한다. 계정은 PENDING으로 만들어지며 본사 승인 뒤 로그인할 수 있다. */
export function signup(body: SignupInput) {
  return apiClient.post<{
    userId: number
    loginId: string
    status: UserStatus
  }>("/api/v1/auth/signup", body)
}

/** 현재 비밀번호가 틀리면 401이 아니라 400 CURRENT_PASSWORD_MISMATCH다. */
export function changePassword(body: {
  currentPassword: string
  newPassword: string
}) {
  return apiClient.patch<null>("/api/v1/auth/me/password", body)
}

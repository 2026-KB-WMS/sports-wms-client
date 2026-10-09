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

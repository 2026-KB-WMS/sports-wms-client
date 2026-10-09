import { apiClient } from "./client"
import type { UserStatus } from "./auth"
import type { ListData } from "./types"

/** 사용자 관리 API (wms-server docs/api/auth.md). HQ_ADMIN 전용. */

export type UserRole = "HQ_ADMIN" | "WAREHOUSE_MANAGER" | "STORE_OWNER"

export interface UserSummary {
  userId: number
  loginId: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
}

/** 필터를 주지 않으면 모든 역할·상태를 반환한다. 페이지네이션은 없다. */
export function getUsers(params?: {
  role?: UserRole
  status?: UserStatus
  keyword?: string
}) {
  return apiClient.get<ListData<UserSummary>>("/api/v1/users", {
    query: params,
  })
}

export interface UserUpdateInput {
  name?: string
  email?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
}

/** 보낸 필드만 수정하며 최소 1개가 필요하다. 가입 승인은 status=ACTIVE다. */
export function updateUser(userId: number, body: UserUpdateInput) {
  return apiClient.patch<Omit<UserSummary, "lastLoginAt" | "createdAt">>(
    `/api/v1/users/${userId}`,
    body
  )
}

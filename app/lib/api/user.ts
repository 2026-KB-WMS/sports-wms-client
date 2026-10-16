import { apiClient } from "./client"
import type { UserStatus } from "./auth"
import type { PagedData, PageParams } from "./types"

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

/** 필터를 주지 않으면 모든 역할·상태를 반환한다. 기본 정렬은 createdAt desc, size 기본 20. */
export function getUsers(
  params?: PageParams & {
    role?: UserRole
    status?: UserStatus
    keyword?: string
  }
) {
  return apiClient.get<PagedData<UserSummary>>("/api/v1/users", {
    query: params,
  })
}

export interface UserUpdateInput {
  name?: string
  email?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
  /**
   * 승인·재활성화(status=ACTIVE)와 함께 보내면 같은 트랜잭션에서 소속을 배정한다. 창고 관리자는 warehouseId,
   * 점주는 storeId만(둘 다·역할 불일치는 400). 이미 소속이 있으면 보내지 않는다(409 AFFILIATION_ASSIGNED).
   */
  warehouseId?: number
  storeId?: number
}

/** 보낸 필드만 수정하며 최소 1개가 필요하다. 가입 승인은 status=ACTIVE다. */
export function updateUser(userId: number, body: UserUpdateInput) {
  return apiClient.patch<Omit<UserSummary, "lastLoginAt" | "createdAt">>(
    `/api/v1/users/${userId}`,
    body
  )
}

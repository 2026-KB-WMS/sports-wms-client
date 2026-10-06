import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 지점 도메인 (Store / StoreMember) API.
 * 명세: wms-server docs/api/store.md
 */

export interface Store {
  storeId: number
  storeCode: string
  storeName: string
  address: string
  contactName: string | null
  contactNumber: string
  isActive: boolean
}

export interface StoreDetail extends Store {
  createdAt: string
  updatedAt: string
}

export interface StoreCreateInput {
  storeCode: string
  storeName: string
  address: string
  contactName?: string | null
  contactNumber: string
}

/** storeCode·isActive는 보내면 400. contactName은 null이면 비운다. */
export interface StoreUpdateInput {
  storeName?: string
  address?: string
  contactName?: string | null
  contactNumber?: string
}

export interface StoreMembership extends Store {
  storeMemberId: number
  memberRole: string
  assignedAt: string
}

export interface CodeItem {
  code: string
  name: string
}

export function getStores(params?: { keyword?: string; isActive?: boolean }) {
  return apiClient.get<ListData<Store>>("/api/v1/stores", { query: params })
}

export function getStore(storeId: number) {
  return apiClient.get<StoreDetail>(`/api/v1/stores/${storeId}`)
}

export function createStore(body: StoreCreateInput) {
  return apiClient.post<StoreDetail>("/api/v1/stores", body)
}

export function updateStore(storeId: number, body: StoreUpdateInput) {
  return apiClient.patch<StoreDetail>(`/api/v1/stores/${storeId}`, body)
}

/** 단방향(재활성화 API 없음). 진행 중인 지점 발주가 있으면 409 STORE_IN_USE. */
export function deactivateStore(storeId: number, body?: { reason?: string }) {
  return apiClient.patch<StoreDetail>(
    `/api/v1/stores/${storeId}/deactivate`,
    body
  )
}

/** STORE_OWNER 전용. 인증 연동 전이라 userId를 쿼리로 넘긴다. */
export function getMyStores(userId: number) {
  return apiClient.get<ListData<StoreMembership>>("/api/v1/stores/my", {
    query: { userId },
  })
}

export function getStoreManagementTypes() {
  return apiClient.get<ListData<CodeItem>>("/api/v1/stores/management-types")
}

// ── 지점 담당자 ──────────────────────────────────────────────

export interface StoreMember {
  storeMemberId: number
  storeId: number
  storeName: string
  userId: number
  memberRole: string
  assignedAt: string
}

export interface StoreMemberAssignInput {
  storeId: number
  userId: number
  memberRole: string
}

export function getStoreManagers(params?: {
  storeId?: number
  userId?: number
}) {
  return apiClient.get<ListData<StoreMember>>("/api/v1/stores/managers", {
    query: params,
  })
}

export function assignStoreManager(body: StoreMemberAssignInput) {
  return apiClient.post<StoreMember>("/api/v1/stores/assign", body)
}

/** 배정 회수(하드 삭제). */
export function releaseStoreManager(storeMemberId: number) {
  return apiClient.delete<{ storeMemberId: number }>(
    `/api/v1/stores/managers/${storeMemberId}`
  )
}

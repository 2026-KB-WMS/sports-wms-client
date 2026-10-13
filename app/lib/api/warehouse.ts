import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 창고 도메인 (Warehouse / WarehouseSection / WarehouseMember / 고정 코드) API.
 * wms-server의 com.kb.wms.warehouse 컨트롤러들과 1:1로 대응한다.
 */

export interface Warehouse {
  warehouseId: number
  warehouseCode: string
  warehouseName: string
  address: string
  /** 지도 API로 입력하지 않은 기존 데이터는 null */
  latitude: number | null
  longitude: number | null
  contactNumber: string | null
  totalCapacity: number | null
  isActive: boolean
}

export interface WarehouseDetail extends Warehouse {
  createdAt: string
  updatedAt: string
}

/** warehouseCode는 보내지 않는다. 서버가 주소의 시·도로 `WH-SU-001` 형식을 발급해 응답으로 준다. */
export interface WarehouseCreateInput {
  warehouseName: string
  address: string
  /** 주소와 함께 쌍으로만 보낸다(한쪽만 보내면 400). */
  latitude?: number
  longitude?: number
  contactNumber?: string | null
  totalCapacity: number
}

export interface WarehouseUpdateInput {
  warehouseName?: string
  address?: string
  /** 주소와 함께 쌍으로만 보낸다(한쪽만 보내면 400). */
  latitude?: number
  longitude?: number
  contactNumber?: string | null
  totalCapacity?: number | null
}

export interface WarehouseMembership extends Warehouse {
  warehouseMemberId: number
  memberRole: string
  assignedAt: string
}

export interface CodeItem {
  code: string
  name: string
}

export function getWarehouses(params?: {
  keyword?: string
  isActive?: boolean
}) {
  return apiClient.get<ListData<Warehouse>>("/api/v1/warehouses", {
    query: params,
  })
}

export function getWarehouse(warehouseId: number) {
  return apiClient.get<WarehouseDetail>(`/api/v1/warehouses/${warehouseId}`)
}

export function createWarehouse(body: WarehouseCreateInput) {
  return apiClient.post<WarehouseDetail>("/api/v1/warehouses", body)
}

export function updateWarehouse(
  warehouseId: number,
  body: WarehouseUpdateInput
) {
  return apiClient.patch<WarehouseDetail>(
    `/api/v1/warehouses/${warehouseId}`,
    body
  )
}

export function deactivateWarehouse(warehouseId: number) {
  return apiClient.patch<WarehouseDetail>(
    `/api/v1/warehouses/${warehouseId}/deactivate`
  )
}

/** 구역은 자동으로 활성화되지 않는다. 이미 ACTIVE면 409 `CONFLICT`. */
export function activateWarehouse(warehouseId: number) {
  return apiClient.patch<WarehouseDetail>(
    `/api/v1/warehouses/${warehouseId}/activate`
  )
}

export function getMyWarehouses() {
  return apiClient.get<ListData<WarehouseMembership>>("/api/v1/warehouses/my")
}

export function getManagementTypes() {
  return apiClient.get<ListData<CodeItem>>(
    "/api/v1/warehouses/management-types"
  )
}

export function getSectionTypes() {
  return apiClient.get<ListData<CodeItem>>("/api/v1/warehouses/section-types")
}

// ── 창고 구역 ──────────────────────────────────────────────

export interface WarehouseSection {
  sectionId: number
  warehouseId: number
  warehouseName: string
  parentSectionId: number | null
  parentSectionCode: string | null
  sectionCode: string
  sectionName: string
  sectionType: string
  capacity: number | null
  currentCapacity: number | null
  availableCapacity: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WarehouseSectionCreateInput {
  warehouseId: number
  parentSectionId?: number | null
  sectionCode: string
  sectionName: string
  sectionType: string
  capacity: number
}

export interface WarehouseSectionUpdateInput {
  sectionCode?: string
  sectionName?: string
  sectionType?: string
  capacity?: number | null
}

export function getSections(params?: {
  warehouseId?: number
  parentSectionId?: number
  sectionType?: string
  keyword?: string
  isActive?: boolean
}) {
  return apiClient.get<ListData<WarehouseSection>>(
    "/api/v1/warehouses/sections",
    { query: params }
  )
}

export function getSectionsByWarehouse(
  warehouseId: number,
  params?: {
    parentSectionId?: number
    sectionType?: string
    keyword?: string
    isActive?: boolean
  }
) {
  return apiClient.get<ListData<WarehouseSection>>(
    `/api/v1/warehouses/${warehouseId}/sections`,
    {
      query: params,
    }
  )
}

export function getSection(sectionId: number) {
  return apiClient.get<WarehouseSection>(
    `/api/v1/warehouses/sections/${sectionId}`
  )
}

export function createSection(body: WarehouseSectionCreateInput) {
  return apiClient.post<WarehouseSection>("/api/v1/warehouses/sections", body)
}

export function updateSection(
  sectionId: number,
  body: WarehouseSectionUpdateInput
) {
  return apiClient.patch<WarehouseSection>(
    `/api/v1/warehouses/sections/${sectionId}`,
    body
  )
}

export function deactivateSection(sectionId: number) {
  return apiClient.patch<WarehouseSection>(
    `/api/v1/warehouses/sections/${sectionId}/deactivate`
  )
}

/** 구역은 창고와 상위 구역이 활성일 때만 가능하다. 상위 수용량을 넘으면 409 `PARENT_CAPACITY_EXCEEDED`. */
export function activateSection(sectionId: number) {
  return apiClient.patch<WarehouseSection>(
    `/api/v1/warehouses/sections/${sectionId}/activate`
  )
}

/**
 * 재고·이력·하위 구역이 전혀 없는 구역만 삭제된다. 409 `SECTION_HAS_INVENTORY`·`SECTION_HAS_CHILDREN`·
 * `SECTION_IN_USE`(입고 이력 등이 참조)이면 비활성화를 쓴다.
 */
export function deleteSection(sectionId: number) {
  return apiClient.delete<{ sectionId: number }>(
    `/api/v1/warehouses/sections/${sectionId}`
  )
}

// ── 창고 관리자 ──────────────────────────────────────────────

export interface WarehouseMember {
  warehouseMemberId: number
  warehouseId: number
  warehouseName: string
  userId: number
  memberRole: string
  assignedAt: string
}

export interface WarehouseMemberAssignInput {
  warehouseId: number
  userId: number
  memberRole: string
}

export function getManagers(params?: {
  warehouseId?: number
  userId?: number
}) {
  return apiClient.get<ListData<WarehouseMember>>(
    "/api/v1/warehouses/managers",
    { query: params }
  )
}

export function assignManager(body: WarehouseMemberAssignInput) {
  return apiClient.post<WarehouseMember>("/api/v1/warehouses/managers", body)
}

export function releaseManager(warehouseMemberId: number) {
  return apiClient.delete<{ warehouseMemberId: number }>(
    `/api/v1/warehouses/managers/${warehouseMemberId}`
  )
}

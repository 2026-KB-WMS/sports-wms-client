import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 공급처 도메인 API.
 * 명세: wms-server docs/api/inbound.md (공급처 절)
 */

export interface Supplier {
  supplierId: number
  supplierCode: string
  supplierName: string
  managerName: string
  contactNumber: string
  email: string | null
  address: string | null
  isActive: boolean
}

export interface SupplierDetail extends Supplier {
  createdAt: string
  updatedAt: string
}

export interface SupplierCreateInput {
  supplierCode: string
  supplierName: string
  managerName: string
  contactNumber: string
  email?: string | null
  address?: string | null
}

/**
 * 부분 수정(1개 이상). email·address는 null이면 비운다.
 * managerName·contactNumber를 null로 보내거나 supplierCode·isActive를 포함하면 400.
 */
export interface SupplierUpdateInput {
  supplierName?: string
  managerName?: string
  contactNumber?: string
  email?: string | null
  address?: string | null
}

/**
 * 창고 관리자는 isActive와 무관하게 활성 공급처만 받는다(발주 등록 시 선택용).
 * 비활성 공급처 조회는 본사 관리자만 가능하다.
 */
export function getSuppliers(params?: {
  keyword?: string
  isActive?: boolean
}) {
  return apiClient.get<ListData<Supplier>>("/api/v1/suppliers", {
    query: params,
  })
}

export function getSupplier(supplierId: number) {
  return apiClient.get<SupplierDetail>(`/api/v1/suppliers/${supplierId}`)
}

export function createSupplier(body: SupplierCreateInput) {
  return apiClient.post<SupplierDetail>("/api/v1/suppliers", body)
}

export function updateSupplier(supplierId: number, body: SupplierUpdateInput) {
  return apiClient.patch<SupplierDetail>(
    `/api/v1/suppliers/${supplierId}`,
    body
  )
}

/** 진행 중(REQUESTED·CONFIRMED) 발주가 있으면 409 SUPPLIER_IN_USE. 되돌리기는 activateSupplier. */
/** 본사 관리자만. 이미 ACTIVE면 409 CONFLICT. */
export function activateSupplier(supplierId: number) {
  return apiClient.patch<SupplierDetail>(
    `/api/v1/suppliers/${supplierId}/activate`
  )
}

export function deactivateSupplier(supplierId: number) {
  return apiClient.patch<SupplierDetail>(
    `/api/v1/suppliers/${supplierId}/deactivate`
  )
}

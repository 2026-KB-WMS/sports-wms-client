import { apiClient } from "./client"
import type { PagedData, PageParams } from "./types"

/**
 * 입고 API.
 * 명세: wms-server docs/api/inbound.md (입고 절), 상태 전이는 docs/domain/inbound.md
 * 날짜·시각은 오프셋 없는 KST(`YYYY-MM-DDTHH:mm:ss`), 날짜는 `YYYY-MM-DD`.
 * 처리 사용자(검수·완료 등)는 서버가 토큰에서 채운다.
 */

export type InboundStatus = "ARRIVED" | "INSPECTING" | "COMPLETED" | "CANCELED"

export interface InboundListItem {
  inboundId: number
  inboundNo: string
  purchaseOrderId: number
  purchaseOrderNo: string
  supplierOrderId: number
  supplierOrderNo: string
  /** 공급처 발주서의 공급처 */
  supplierId: number
  supplierName: string
  warehouseId: number
  warehouseName: string
  status: InboundStatus
  arrivedAt: string
  receivedAt: string | null
  receivedBy: number | null
  receivedByName: string | null
  /** 검수 항목 수. ARRIVED면 0 */
  lineCount: number
}

export interface Inbound extends InboundListItem {
  note: string | null
  /** 취소된 입고의 사유. 아니면 null */
  cancelReason: string | null
  createdAt: string
  updatedAt: string
}

export interface InboundLine {
  inboundLineId: number
  purchaseOrderLineId: number
  skuId: number
  skuCode: string
  skuName: string
  lotId: number
  lotNumber: string
  manufacturedDate: string | null
  expiryDate: string | null
  receivedQuantity: number
  acceptedQuantity: number
  defectiveQuantity: number
  acceptedSectionId: number | null
  acceptedSectionCode: string | null
  defectSectionId: number | null
  defectSectionCode: string | null
  orderedUnitPrice: number
  receivedUnitPrice: number
  lineAmount: number
  priceChangeReason: string | null
  inspectionNote: string | null
  receivedAt: string | null
  receivedBy: number | null
  receivedByName: string | null
}

export interface InboundDetails {
  inboundId: number
  inboundNo: string
  status: InboundStatus
  /** ARRIVED는 빈 배열 */
  items: InboundLine[]
}

export interface AssignableSection {
  sectionId: number
  parentSectionId: number | null
  sectionCode: string
  sectionName: string
  sectionType: string
  capacity: number | null
  currentCapacity: number | null
  availableCapacity: number | null
}

export interface InboundCreateInput {
  /** ISSUED·PARTIALLY_RECEIVED 공급처 발주서만 */
  supplierOrderId: number
  /** 현재 이전 시각. 생략하면 요청 시각 */
  arrivedAt?: string
  note?: string
}

export interface InspectLineInput {
  purchaseOrderLineId: number
  lotNumber: string
  manufacturedDate?: string
  expiryDate?: string
  receivedQuantity: number
  /** accepted + defective = received */
  acceptedQuantity: number
  defectiveQuantity: number
  receivedUnitPrice: number
  /** 발주 단가와 다르면 필수 */
  priceChangeReason?: string
  inspectionNote?: string
  acceptedSectionId?: number
  defectSectionId?: number
}

export function getInbounds(
  params?: PageParams & {
    status?: InboundStatus
    warehouseId?: number
    purchaseOrderId?: number
    supplierOrderId?: number
    keyword?: string
    arrivedFrom?: string
    arrivedTo?: string
  }
) {
  return apiClient.get<PagedData<InboundListItem>>("/api/v1/inbounds", {
    query: params,
  })
}

export function getInbound(inboundId: number) {
  return apiClient.get<Inbound>(`/api/v1/inbounds/${inboundId}`)
}

export function getInboundDetails(inboundId: number) {
  return apiClient.get<InboundDetails>(`/api/v1/inbounds/${inboundId}/details`)
}

/** 합격품 적치 가능 구역(DEFECT가 아닌 활성 구역). 수용량을 예약하지는 않는다. */
export function getAssignableSections(inboundId: number) {
  return apiClient.get<{ inboundId: number; items: AssignableSection[] }>(
    `/api/v1/inbounds/${inboundId}/assignable-sections`
  )
}

/** 불량품 적치 가능 구역(DEFECT 구역). */
export function getDefectSections(inboundId: number) {
  return apiClient.get<{ inboundId: number; items: AssignableSection[] }>(
    `/api/v1/inbounds/${inboundId}/defect-sections`
  )
}

/**
 * 창고 관리자만. 진행 중(ISSUED·PARTIALLY_RECEIVED)인 공급처 발주서에 대해서만 등록한다.
 * 같은 발주서에는 진행 중 입고를 1건만 둘 수 있고(409 INBOUND_IN_PROGRESS), 다른 발주서의 입고는 병렬이다.
 */
export function createInbound(body: InboundCreateInput) {
  return apiClient.post<Inbound>("/api/v1/inbounds", body)
}

/**
 * 검수 항목 **전체**를 통째로 교체한다(재호출 가능, 재고 미반영).
 * 처음 호출하면 ARRIVED → INSPECTING.
 */
export function inspectInbound(inboundId: number, lines: InspectLineInput[]) {
  return apiClient.patch<{ inboundId: number; status: InboundStatus }>(
    `/api/v1/inbounds/${inboundId}/inspect`,
    { lines }
  )
}

/** INSPECTING에서만. 재고·발주 수량이 한 트랜잭션으로 반영된다. */
export function completeInbound(inboundId: number) {
  return apiClient.patch<{
    inboundId: number
    inboundNo: string
    status: InboundStatus
    receivedAt: string
    supplierOrder: { supplierOrderId: number; status: string }
    purchaseOrder: { purchaseOrderId: number; status: string }
  }>(`/api/v1/inbounds/${inboundId}/complete`, undefined)
}

/** ARRIVED·INSPECTING에서만. 사유 필수(≤500). 재고는 바뀌지 않는다. */
export function cancelInbound(inboundId: number, reason: string) {
  return apiClient.patch<{ inboundId: number; status: InboundStatus }>(
    `/api/v1/inbounds/${inboundId}/cancel`,
    { reason }
  )
}

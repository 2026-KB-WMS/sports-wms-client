import { apiClient } from "./client"
import type { ListData } from "./types"

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
  supplierId: number
  supplierName: string
  warehouseId: number
  warehouseName: string
  status: InboundStatus
  arrivedAt: string
  receivedAt: string | null
  receivedBy: number | null
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
  /** CONFIRMED 발주만 */
  purchaseOrderId: number
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

export function getInbounds(params?: {
  status?: InboundStatus
  warehouseId?: number
  purchaseOrderId?: number
  keyword?: string
  arrivedFrom?: string
  arrivedTo?: string
}) {
  return apiClient.get<ListData<InboundListItem>>("/api/v1/inbounds", {
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

/** 창고 관리자만. 확정(CONFIRMED)된 발주에 대해서만, 같은 발주에는 진행 중 입고를 1건만 둘 수 있다. */
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

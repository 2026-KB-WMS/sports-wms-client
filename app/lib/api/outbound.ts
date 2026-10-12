import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 출고(Outbound)·재고 할당(StockAllocation) API.
 * 명세: wms-server docs/api/outbound.md, 상태 전이·부수 효과는 docs/domain/outbound.md
 * 날짜·시각은 오프셋 없는 KST(`YYYY-MM-DDTHH:mm:ss`).
 * 처리 사용자는 서버가 토큰에서 채운다.
 * 점주는 이 API를 호출할 수 없다(진행 상태는 지점 발주의 progressStage로 본다).
 */

// ── 재고 할당 ──────────────────────────────────────────────

export type AllocationStatus = "ALLOCATED" | "PICKED" | "RELEASED"

export interface Allocation {
  allocationId: number
  storeOrderId: number
  orderNo: string
  storeOrderLineId: number
  warehouseId: number
  skuId: number
  skuCode: string
  skuName: string
  inventoryLotId: number
  lotId: number
  lotNumber: string
  expiryDate: string | null
  sectionId: number
  sectionCode: string
  allocatedQuantity: number
  pickedQuantity: number
  status: AllocationStatus
  allocatedAt: string
  releasedAt: string | null
}

export interface AllocationDetail {
  allocationId: number
  status: AllocationStatus
  allocatedQuantity: number
  pickedQuantity: number
  allocatedAt: string
  allocatedBy: number
  allocatedByName: string | null
  releasedAt: string | null
  storeOrderId: number
  orderNo: string
  storeId: number
  storeName: string
  warehouseId: number
  storeOrderLineId: number
  requestedQuantity: number
  skuId: number
  skuCode: string
  skuName: string
  inventoryLotId: number
  lotId: number
  lotNumber: string
  expiryDate: string | null
  sectionId: number
  sectionCode: string
  sectionName: string
  /** 취소되지 않은 출고에 연결된 경우에만 값이 있다 */
  outboundId: number | null
}

export function getAllocations(params?: {
  storeOrderId?: number
  warehouseId?: number
  skuId?: number
  status?: AllocationStatus
  keyword?: string
}) {
  return apiClient.get<ListData<Allocation>>("/api/v1/allocations", {
    query: params,
  })
}

export function getAllocation(allocationId: number) {
  return apiClient.get<AllocationDetail>(`/api/v1/allocations/${allocationId}`)
}

/** 재고가 모자라 일부만 할당된 SKU. 재고가 들어온 뒤 같은 요청을 다시 보내면 남은 수량을 이어서 할당한다. */
export interface AllocationShortage {
  skuId: number
  requestedQuantity: number
  allocatedQuantity: number
  shortageQuantity: number
}

/**
 * 창고 관리자만. 발주(ASSIGNED)의 잔여 수량을 FEFO로 할당한다. `skuIds`를 생략하면 발주 전체, 주면 그 SKU만(빈 배열은 400).
 * 부분 할당: 항목별로 가용 재고만큼만 할당하고 부족분은 `shortages`로 온다.
 * 대상 전부를 하나도 못 하면 409 INSUFFICIENT_STOCK(SKU별 요청·가용 수량은 메시지에 담김).
 */
export function allocateStoreOrder(storeOrderId: number, skuIds?: number[]) {
  return apiClient.post<{
    storeOrderId: number
    orderNo: string
    items: Allocation[]
    shortages: AllocationShortage[]
  }>("/api/v1/allocations", { storeOrderId, skuIds })
}

/** 창고 관리자만. ALLOCATED → RELEASED. 출고에 묶인 할당은 409 ALLOCATION_IN_OUTBOUND. 사유 필수(≤500). */
export function releaseAllocation(allocationId: number, reason: string) {
  return apiClient.patch<{
    allocationId: number
    status: AllocationStatus
    allocatedQuantity: number
    releasedAt: string
  }>(`/api/v1/allocations/${allocationId}/release`, { reason })
}

// ── 출고 ──────────────────────────────────────────────────

export type OutboundStatus =
  "READY" | "PICKING" | "PICKED" | "SHIPPED" | "DELIVERED" | "CANCELED"

export interface OutboundListItem {
  outboundId: number
  outboundNo: string
  storeOrderId: number
  orderNo: string
  storeId: number
  storeName: string
  warehouseId: number
  warehouseName: string
  status: OutboundStatus
  lineCount: number
  /** 배송 시작 전에는 null */
  shippedAt: string | null
  shippedBy: number | null
  createdAt: string
}

export interface OutboundLine {
  outboundLineId: number
  allocationId: number
  storeOrderLineId: number
  skuId: number
  skuCode: string
  skuName: string
  unit: string | null
  inventoryLotId: number
  lotId: number
  lotNumber: string
  expiryDate: string | null
  sectionId: number
  sectionCode: string
  allocatedQuantity: number
  /** 피킹 완료 전 0, 완료 후 실제 피킹 수량(할당보다 작으면 부족분) */
  shippedQuantity: number
  /** 피킹 완료 전 null */
  confirmedUnitSupplyPrice: number | null
  lineAmount: number | null
}

export interface OutboundDetails {
  outboundId: number
  outboundNo: string
  status: OutboundStatus
  storeOrderId: number
  orderNo: string
  storeId: number
  storeName: string
  warehouseId: number
  warehouseName: string
  shippedAt: string | null
  shippedBy: number | null
  deliveredAt: string | null
  note: string | null
  /** 취소된 출고의 사유 */
  cancelReason: string | null
  items: OutboundLine[]
  createdAt: string
  updatedAt: string
}

export function getOutbounds(params?: {
  status?: OutboundStatus
  warehouseId?: number
  storeId?: number
  storeOrderId?: number
  keyword?: string
  createdFrom?: string
  createdTo?: string
}) {
  return apiClient.get<ListData<OutboundListItem>>("/api/v1/outbounds", {
    query: params,
  })
}

export function getOutboundDetails(outboundId: number) {
  return apiClient.get<OutboundDetails>(
    `/api/v1/outbounds/${outboundId}/details`
  )
}

/**
 * 창고 관리자만. 발주(ASSIGNED)에서 출고에 묶이지 않은 ALLOCATED 할당을 묶어 READY 출고를 만든다.
 * `skuIds`를 생략하면 전부, 주면 그 SKU의 할당만(나머지는 ALLOCATED로 남음). 묶을 할당이 없으면 409 NO_ALLOCATION.
 */
export function createOutbound(body: {
  storeOrderId: number
  note?: string
  skuIds?: number[]
}) {
  return apiClient.post<{
    outboundId: number
    outboundNo: string
    status: OutboundStatus
  }>("/api/v1/outbounds", body)
}

/** READY → PICKING. 이 시점부터 할당 해제·본사 발주 취소가 막힌다. */
export function startPicking(outboundId: number) {
  return apiClient.patch<{ outboundId: number; status: OutboundStatus }>(
    `/api/v1/outbounds/${outboundId}/picking/start`,
    undefined
  )
}

export interface PickedLineInput {
  outboundLineId: number
  /** 0 이상 정수, 해당 항목 할당 수량 이하 */
  pickedQuantity: number
}

export interface PickingCompleteResult {
  outboundId: number
  status: OutboundStatus
  hasShortage: boolean
  items: {
    outboundLineId: number
    allocationId: number
    allocatedQuantity: number
    pickedQuantity: number
    shortageQuantity: number
    confirmedUnitSupplyPrice: number
    lineAmount: number
  }[]
}

/**
 * PICKING → PICKED. **이때 재고가 차감된다**(배송 시작이 아님). 항목 전체를 한 번에 보내야 하며,
 * 모두 0이면 409 NOTHING_PICKED. 부족분은 예약이 풀리고 발주에 미출고 수량으로 남는다.
 */
export function completePicking(outboundId: number, lines: PickedLineInput[]) {
  return apiClient.patch<PickingCompleteResult>(
    `/api/v1/outbounds/${outboundId}/picking/complete`,
    { lines }
  )
}

/** PICKED → SHIPPED. 재고는 바뀌지 않는다. */
export function shipOutbound(outboundId: number) {
  return apiClient.patch<{ outboundId: number; status: OutboundStatus }>(
    `/api/v1/outbounds/${outboundId}/ship`,
    undefined
  )
}

/** SHIPPED → DELIVERED. 모든 항목이 출고되고 진행 중 출고가 없으면 발주가 자동으로 COMPLETED가 된다. */
export function deliverOutbound(outboundId: number) {
  return apiClient.patch<{
    outboundId: number
    status: OutboundStatus
    storeOrder: { storeOrderId: number; status: string }
  }>(`/api/v1/outbounds/${outboundId}/deliver`, undefined)
}

/** READY에서만 CANCELED로. 사유 필수(≤500). 할당은 ALLOCATED로 남아 다시 묶거나 해제할 수 있다. */
export function cancelOutbound(outboundId: number, reason: string) {
  return apiClient.patch<{ outboundId: number; status: OutboundStatus }>(
    `/api/v1/outbounds/${outboundId}/cancel`,
    { reason }
  )
}

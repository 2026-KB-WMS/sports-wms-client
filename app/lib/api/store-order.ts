import { apiClient } from "./client"
import type { PagedData, PageParams } from "./types"

/**
 * 지점 발주(지점 → 창고) API. 창고 발주(`/purchase-orders`)와 구분한다.
 * 명세: wms-server docs/api/store-order.md, 상태 전이는 docs/domain/store-order.md
 * 날짜·시각은 오프셋 없는 KST(`YYYY-MM-DDTHH:mm:ss`).
 * 처리 사용자(등록·승인·반려·취소·배정·보류·재개·부분 종결)는 서버가 토큰에서 채운다.
 * 목록은 본사 관리자만 `GET /orders`, 점주·창고 관리자는 `GET /orders/my`(서버가 담당 범위로 좁힘)다.
 */

export type StoreOrderStatus =
  | "REQUESTED"
  | "APPROVED"
  | "ASSIGNED"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED"

/** 점주용 진행 단계(서버가 상태·최근 출고 상태로 계산해 내려주는 읽기 전용 값) */
export type StoreOrderProgressStage =
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "CANCELED"
  | "AWAITING_ASSIGNMENT"
  | "PREPARING"
  | "IN_TRANSIT"
  | "PARTIALLY_DELIVERED"
  | "ON_HOLD"
  | "COMPLETED"
  | "COMPLETED_PARTIAL"

export interface StoreOrderListItem {
  storeOrderId: number
  orderNo: string
  storeId: number
  storeName: string
  /** 창고 배정 전(REQUESTED·APPROVED 등)에는 null */
  warehouseId: number | null
  warehouseName: string | null
  status: StoreOrderStatus
  progressStage: StoreOrderProgressStage
  requestedAt: string
  requestedDeliveryAt: string | null
  lineCount: number
  totalAmount: number
  /** 가장 최근 출고의 상태. 출고가 없으면 null */
  latestOutboundStatus: string | null
}

export interface StoreOrder extends StoreOrderListItem {
  /** REJECTED·CANCELED·ON_HOLD일 때만 값이 있다 */
  statusReason: string | null
  note: string | null
  createdBy: number
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

export interface StoreOrderLine {
  storeOrderLineId: number
  skuId: number
  skuCode: string
  skuName: string
  unit: string | null
  requestedQuantity: number
  allocatedQuantity: number
  shippedQuantity: number
  /** requestedQuantity − shippedQuantity */
  remainingQuantity: number
  requestedUnitSupplyPrice: number
  lineAmount: number
  status: "REQUESTED" | "PARTIALLY_SHIPPED" | "COMPLETED" | "CANCELED"
}

export interface StoreOrderOutbound {
  outboundId: number
  outboundNo: string
  status: string
  shippedAt: string | null
  deliveredAt: string | null
}

export interface StoreOrderStatusHistory {
  fromStatus: StoreOrderStatus | null
  toStatus: StoreOrderStatus
  reason: string | null
  changedBy: number
  changedByName: string | null
  changedAt: string
}

export interface StoreOrderDetails {
  storeOrderId: number
  orderNo: string
  status: StoreOrderStatus
  progressStage: StoreOrderProgressStage
  items: StoreOrderLine[]
  outbounds: StoreOrderOutbound[]
  statusHistory: StoreOrderStatusHistory[]
}

export interface StoreOrderCreateInput {
  /** 점주가 배정된 지점 */
  storeId: number
  /** 현재 이후 시각 */
  requestedDeliveryAt?: string
  note?: string
  /** 1개 이상, 같은 SKU 중복 불가, 수량은 1 이상 정수 */
  lines: { skuId: number; requestedQuantity: number }[]
}

export type StoreOrderListParams = PageParams & {
  status?: StoreOrderStatus
  storeId?: number
  warehouseId?: number
  keyword?: string
  requestedFrom?: string
  requestedTo?: string
}

export function getStoreOrders(params?: StoreOrderListParams) {
  return apiClient.get<PagedData<StoreOrderListItem>>("/api/v1/orders", {
    query: params,
  })
}

/** 점주·창고 관리자용. 본사 관리자가 호출하면 403이다. */
export function getMyStoreOrders(params?: StoreOrderListParams) {
  return apiClient.get<PagedData<StoreOrderListItem>>("/api/v1/orders/my", {
    query: params,
  })
}

export function getStoreOrder(storeOrderId: number) {
  return apiClient.get<StoreOrder>(`/api/v1/orders/${storeOrderId}`)
}

export function getStoreOrderDetails(storeOrderId: number) {
  return apiClient.get<StoreOrderDetails>(
    `/api/v1/orders/${storeOrderId}/details`
  )
}

/** 점주만. 항목 단가는 서버가 SKU 현재 공급가로 채운다(없으면 409 SUPPLY_PRICE_MISSING). */
export function createStoreOrder(body: StoreOrderCreateInput) {
  return apiClient.post<StoreOrder & { lines: StoreOrderLine[] }>(
    "/api/v1/orders",
    body
  )
}

/** 본사 관리자만. REQUESTED → APPROVED. */
export function approveStoreOrder(storeOrderId: number) {
  return apiClient.patch<{ storeOrderId: number; status: StoreOrderStatus }>(
    `/api/v1/orders/${storeOrderId}/approve`,
    undefined
  )
}

/** 본사 관리자만. REQUESTED → REJECTED. 사유 필수(≤500). */
export function rejectStoreOrder(storeOrderId: number, reason: string) {
  return apiClient.patch<{ storeOrderId: number; status: StoreOrderStatus }>(
    `/api/v1/orders/${storeOrderId}/reject`,
    { reason }
  )
}

export interface CancelStoreOrderResult {
  storeOrderId: number
  status: StoreOrderStatus
  releasedAllocationCount: number
  canceledOutboundCount: number
}

/**
 * REQUESTED는 작성자(점주)만, 승인 이후(APPROVED·ASSIGNED·ON_HOLD)는 본사 관리자만 취소한다.
 * reason(≤500)은 승인 이후 취소에서 필수, REQUESTED 취소에서 선택.
 * 피킹이 시작된 출고가 있으면 409 ORDER_IN_PICKING.
 */
export function cancelStoreOrder(storeOrderId: number, reason?: string) {
  return apiClient.patch<CancelStoreOrderResult>(
    `/api/v1/orders/${storeOrderId}/cancel`,
    reason ? { reason } : undefined
  )
}

/**
 * 본사 관리자만. 최초 배정(APPROVED → ASSIGNED)과 재배정(ASSIGNED의 창고 변경)을 함께 쓴다.
 * 재배정은 reason 필수이며 할당·출고가 남아 있으면 409 ORDER_IN_FULFILLMENT.
 */
export function assignStoreOrder(body: {
  storeOrderId: number
  warehouseId: number
  reason?: string
}) {
  return apiClient.post<{
    storeOrderId: number
    status: StoreOrderStatus
    warehouseId: number
    warehouseName: string
  }>("/api/v1/orders/assign", body)
}

/** 창고 관리자만. ASSIGNED → ON_HOLD. 사유 필수. 피킹이 시작된 출고가 있으면 409 ORDER_IN_PICKING. */
export function holdStoreOrder(storeOrderId: number, reason: string) {
  return apiClient.patch<{ storeOrderId: number; status: StoreOrderStatus }>(
    `/api/v1/orders/${storeOrderId}/hold`,
    { reason }
  )
}

/** 창고 관리자만. ON_HOLD → ASSIGNED. 사유 필수. */
export function resumeStoreOrder(storeOrderId: number, reason: string) {
  return apiClient.patch<{ storeOrderId: number; status: StoreOrderStatus }>(
    `/api/v1/orders/${storeOrderId}/resume`,
    { reason }
  )
}

export interface CompletePartialResult {
  storeOrderId: number
  status: StoreOrderStatus
  releasedAllocationCount: number
  items: {
    storeOrderLineId: number
    skuCode: string
    requestedQuantity: number
    shippedQuantity: number
    shortageQuantity: number
  }[]
}

/**
 * 창고 관리자만. 부족 수량을 남긴 채 ASSIGNED → COMPLETED로 종결. 사유 필수.
 * 진행 중 출고가 있으면 409 OUTBOUND_IN_PROGRESS, 부족 수량이 없으면 409 NO_SHORTAGE.
 */
export function completePartialStoreOrder(
  storeOrderId: number,
  reason: string
) {
  return apiClient.patch<CompletePartialResult>(
    `/api/v1/orders/${storeOrderId}/complete-partial`,
    { reason }
  )
}

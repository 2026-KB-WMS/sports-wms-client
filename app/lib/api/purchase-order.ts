import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 창고 발주(창고 → 공급처) API. 지점 발주(`/orders`)와 구분한다.
 * 명세: wms-server docs/api/inbound.md (창고 발주 절)
 * 날짜·시각은 오프셋 없는 KST(`YYYY-MM-DDTHH:mm:ss`)로 주고받는다.
 */

export type PurchaseOrderStatus =
  "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELED"

export interface PurchaseOrderListItem {
  purchaseOrderId: number
  purchaseOrderNo: string
  warehouseId: number
  warehouseName: string
  supplierId: number
  supplierName: string
  status: PurchaseOrderStatus
  expectedAt: string | null
  lineCount: number
  totalAmount: number
  createdBy: number
  createdByName: string | null
  createdAt: string
}

export interface PurchaseOrder extends PurchaseOrderListItem {
  note: string | null
  /** 취소된 발주의 사유. 아니면 null */
  cancelReason: string | null
  updatedAt: string
}

export interface PurchaseOrderLine {
  purchaseOrderLineId: number
  skuId: number
  skuCode: string
  skuName: string
  unit: string | null
  expectedQuantity: number
  receivedQuantity: number
  remainingQuantity: number
  /** 등록 시점의 매입 단가 스냅샷 */
  orderedUnitPrice: number
  lineAmount: number
  status: "REQUESTED" | "PARTIALLY_RECEIVED" | "COMPLETED"
}

export interface PurchaseOrderDetails {
  purchaseOrderId: number
  purchaseOrderNo: string
  status: PurchaseOrderStatus
  items: PurchaseOrderLine[]
}

export interface PurchaseOrderCreateInput {
  warehouseId: number
  supplierId: number
  /** 미래 시각 (YYYY-MM-DDTHH:mm:ss) */
  expectedAt?: string
  note?: string
  /** 1개 이상, 같은 SKU 중복 불가 */
  lines: { skuId: number; expectedQuantity: number }[]
}

export function getPurchaseOrders(params?: {
  status?: PurchaseOrderStatus
  warehouseId?: number
  supplierId?: number
  keyword?: string
  createdFrom?: string
  createdTo?: string
}) {
  return apiClient.get<ListData<PurchaseOrderListItem>>(
    "/api/v1/purchase-orders",
    { query: params }
  )
}

export function getPurchaseOrder(purchaseOrderId: number) {
  return apiClient.get<PurchaseOrder>(
    `/api/v1/purchase-orders/${purchaseOrderId}`
  )
}

export function getPurchaseOrderDetails(purchaseOrderId: number) {
  return apiClient.get<PurchaseOrderDetails>(
    `/api/v1/purchase-orders/${purchaseOrderId}/details`
  )
}

/** 창고 관리자만, 본인 담당 창고에 한해 등록한다. 항목 단가는 서버가 SKU 현재 매입가로 채운다. */
export function createPurchaseOrder(body: PurchaseOrderCreateInput) {
  return apiClient.post<PurchaseOrder & { lines: PurchaseOrderLine[] }>(
    "/api/v1/purchase-orders",
    body
  )
}

/** 본사 관리자만. REQUESTED → CONFIRMED. */
export function confirmPurchaseOrder(purchaseOrderId: number) {
  return apiClient.patch<{
    purchaseOrderId: number
    purchaseOrderNo: string
    status: PurchaseOrderStatus
    updatedAt: string
  }>(`/api/v1/purchase-orders/${purchaseOrderId}/confirm`)
}

/**
 * REQUESTED는 작성자(창고 관리자)만, CONFIRMED는 본사 관리자만 취소한다.
 * reason(≤500)은 CONFIRMED 취소 시 필수, REQUESTED 취소 시 선택.
 */
export function cancelPurchaseOrder(
  purchaseOrderId: number,
  body?: { reason?: string }
) {
  return apiClient.patch<{
    purchaseOrderId: number
    purchaseOrderNo: string
    status: PurchaseOrderStatus
    cancelReason: string | null
    updatedAt: string
  }>(`/api/v1/purchase-orders/${purchaseOrderId}/cancel`, body)
}

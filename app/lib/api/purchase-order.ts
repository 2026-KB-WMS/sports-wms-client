import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 창고 발주 요청 API. 지점 발주(`/orders`)와 구분한다.
 * 창고 관리자는 SKU·수량만 요청하고, 본사가 확정할 때 라인별 공급처를 지정하면 공급처 발주서가 생긴다.
 * 명세: wms-server docs/api/inbound.md ("공급처 발주서 개편" 절이 기준)
 * 날짜·시각은 오프셋 없는 KST(`YYYY-MM-DDTHH:mm:ss`)로 주고받는다.
 */

export type PurchaseOrderStatus =
  "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "REJECTED"

export type SupplierOrderStatus =
  "ISSUED" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELED"

/** 확정으로 생긴 공급처 발주서 요약. */
export interface SupplierOrderRef {
  supplierOrderId: number
  supplierOrderNo: string
  supplierId: number
  supplierName: string
  status: SupplierOrderStatus
  lineCount: number
  totalAmount: number
}

export interface PurchaseOrderListItem {
  purchaseOrderId: number
  purchaseOrderNo: string
  warehouseId: number
  warehouseName: string
  /** 라인에 배정된 공급처. 확정 전에는 빈 배열 */
  suppliers: { supplierId: number; supplierName: string }[]
  status: PurchaseOrderStatus
  expectedAt: string | null
  lineCount: number
  totalAmount: number
  createdBy: number
  createdByName: string | null
  createdAt: string
}

/** 단건 응답에는 `suppliers[]`가 없고, 확정 뒤의 공급처는 `supplierOrders[]`로 본다. */
export interface PurchaseOrder extends Omit<
  PurchaseOrderListItem,
  "suppliers"
> {
  note: string | null
  /** 취소된 발주의 사유. 아니면 null */
  cancelReason: string | null
  /** 반려된 요청의 사유. 아니면 null */
  rejectReason: string | null
  /** 확정 전에는 빈 배열 */
  supplierOrders: SupplierOrderRef[]
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
  /** 본사가 확정할 때 배정한다. 확정 전에는 null */
  supplierId: number | null
  supplierName: string | null
  supplierOrderId: number | null
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
  return apiClient.post<
    Omit<PurchaseOrder, "rejectReason" | "supplierOrders"> & {
      lines: PurchaseOrderLine[]
    }
  >("/api/v1/purchase-orders", body)
}

/**
 * 본사 관리자만. REQUESTED → CONFIRMED. 라인별 공급처를 지정하고 공급처 발주서를 만든다(한 트랜잭션).
 * `lines`를 생략하거나 일부만 주면 이미 배정된 공급처를 유지하고, 확정 후에는 모든 라인에 공급처가 있어야 한다.
 * 400 LINE_SUPPLIER_REQUIRED, 409 SKU_SUPPLIER_NOT_MAPPED·SUPPLIER_INACTIVE·CONFLICT.
 */
export function confirmPurchaseOrder(
  purchaseOrderId: number,
  body?: { lines: { purchaseOrderLineId: number; supplierId: number }[] }
) {
  return apiClient.patch<{
    purchaseOrderId: number
    purchaseOrderNo: string
    status: PurchaseOrderStatus
    updatedAt: string
    supplierOrders: SupplierOrderRef[]
  }>(`/api/v1/purchase-orders/${purchaseOrderId}/confirm`, body)
}

/** 본사 관리자만. REQUESTED → REJECTED. 사유 필수(≤500). */
export function rejectPurchaseOrder(purchaseOrderId: number, reason: string) {
  return apiClient.patch<{
    purchaseOrderId: number
    purchaseOrderNo: string
    status: PurchaseOrderStatus
    rejectReason: string
    updatedAt: string
  }>(`/api/v1/purchase-orders/${purchaseOrderId}/reject`, { reason })
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

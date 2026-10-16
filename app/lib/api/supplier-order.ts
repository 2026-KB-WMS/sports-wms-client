import { apiClient } from "./client"
import type { SupplierOrderStatus } from "./purchase-order"
import type { PagedData, PageParams } from "./types"

/**
 * 공급처 발주서 API(조회 전용). 본사가 창고 발주 요청을 확정할 때 공급처당 한 건씩 자동 생성된다.
 * 명세: wms-server docs/api/inbound.md ("공급처 발주서 개편" 절)
 * 상태는 입고 완료·요청 취소의 결과로만 바뀌며 수동 변경 API는 없다.
 */

export type { SupplierOrderStatus }

export interface SupplierOrderListItem {
  supplierOrderId: number
  supplierOrderNo: string
  purchaseOrderId: number
  purchaseOrderNo: string
  supplierId: number
  supplierName: string
  warehouseId: number
  warehouseName: string
  status: SupplierOrderStatus
  lineCount: number
  totalAmount: number
  createdAt: string
}

export interface SupplierOrderLine {
  purchaseOrderLineId: number
  skuId: number
  skuCode: string
  skuName: string
  unit: string | null
  expectedQuantity: number
  receivedQuantity: number
  remainingQuantity: number
  orderedUnitPrice: number
  lineAmount: number
  status: "REQUESTED" | "PARTIALLY_RECEIVED" | "COMPLETED"
}

export interface SupplierOrder extends SupplierOrderListItem {
  updatedAt: string
  lines: SupplierOrderLine[]
}

/** HQ_ADMIN 전체, WAREHOUSE_MANAGER는 담당 창고만(타 창고는 403). */
export function getSupplierOrders(
  params?: PageParams & {
    status?: SupplierOrderStatus
    warehouseId?: number
    supplierId?: number
    purchaseOrderId?: number
    keyword?: string
    createdFrom?: string
    createdTo?: string
  }
) {
  return apiClient.get<PagedData<SupplierOrderListItem>>(
    "/api/v1/supplier-orders",
    { query: params }
  )
}

export function getSupplierOrder(supplierOrderId: number) {
  return apiClient.get<SupplierOrder>(
    `/api/v1/supplier-orders/${supplierOrderId}`
  )
}

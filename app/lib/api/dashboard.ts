import { apiClient } from "./client"

/**
 * 대시보드 도메인 API. wms-server의 com.kb.wms.dashboard 컨트롤러와 대응한다.
 * 읽기 전용 집계이고 페이지네이션이 없다. 명세는 wms-server docs/api/dashboard.md.
 */

export interface CountQuantity {
  count: number
  quantity: number
}

export interface FlowSummary {
  completed: CountQuantity
  inProgress: CountQuantity
  previousMonthCompleted: CountQuantity
}

export interface HqWarehouseSummary {
  warehouseId: number
  warehouseName: string
  inventoryQuantity: number
  lowStockSkuCount: number
  inbound: { completedQuantity: number; inProgressQuantity: number }
  outbound: { completedQuantity: number; inProgressQuantity: number }
}

export interface HqSummary {
  month: string
  pending: {
    storeOrderRequestedCount: number
    purchaseOrderRequestedCount: number
    unassignedApprovedStoreOrderCount: number
  }
  inventory: {
    totalQuantity: number
    quarantinedQuantity: number
    disposedQuantity: number
    expiredQuantity: number
    defectiveQuantity: number
    activeSkuCount: number
    lowStockSkuCount: number
    expiringLotCount: number
  }
  inbound: FlowSummary
  outbound: FlowSummary
  storeOrders: {
    totalCount: number
    byStatus: Record<string, number>
    /** 분모(취소·반려 제외)가 0이면 null */
    completionRate: number | null
  }
  warehouses: HqWarehouseSummary[]
}

export interface HqTrendItem {
  month: string
  inboundCompletedQuantity: number
  outboundCompletedQuantity: number
  /** 진행중은 스냅샷이라 현재 달에만 값이 있고 지난 달은 null */
  inboundInProgressQuantity: number | null
  outboundInProgressQuantity: number | null
}

export interface TopOutboundSku {
  skuId: number
  skuCode: string
  skuName: string
  quantity: number
}

export interface HqTrends {
  items: HqTrendItem[]
  topOutboundSkus: TopOutboundSku[]
}

export interface LowStockSku {
  skuId: number
  skuCode: string
  skuName: string
  availableQuantity: number
  safetyStockQuantity: number
}

export interface WarehouseSummary {
  warehouseId: number
  warehouseName: string
  pending: {
    inbound: { arrivedCount: number; inspectingCount: number }
    outbound: {
      readyCount: number
      pickingCount: number
      shippedCount: number
    }
  }
  capacity: {
    capacity: number
    currentCapacity: number
    availableCapacity: number
    /** capacity가 0이면 null */
    usageRate: number | null
  }
  inventory: {
    lowStockSkuCount: number
    lowStockSkus: LowStockSku[]
    expiringLotCount: number
  }
}

export function getHqSummary(params?: {
  month?: string
  expiringWithinDays?: number
}) {
  return apiClient.get<HqSummary>("/api/v1/dashboard/hq/summary", {
    query: params,
  })
}

export function getHqTrends(params?: {
  months?: number
  warehouseId?: number
}) {
  return apiClient.get<HqTrends>("/api/v1/dashboard/hq/trends", {
    query: params,
  })
}

export function getWarehouseSummary(params?: {
  warehouseId?: number
  expiringWithinDays?: number
}) {
  return apiClient.get<WarehouseSummary>(
    "/api/v1/dashboard/warehouse/summary",
    {
      query: params,
    }
  )
}

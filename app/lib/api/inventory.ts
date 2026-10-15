import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 재고 도메인 (Inventory / Lot / Transaction) API.
 * wms-server의 com.kb.wms.inventory 컨트롤러들(InventoryController, LotController)과 1:1로 대응한다.
 */

export type QualityStatus = "AVAILABLE" | "DEFECTIVE"
export type LotStatus = "AVAILABLE" | "EXPIRED" | "QUARANTINED" | "DISPOSED"
export type TransactionType = "INBOUND" | "OUTBOUND" | "ADJUSTMENT"
export type ReferenceType = "INBOUND" | "OUTBOUND" | "ADJUSTMENT"

// ── 재고 (SKU 기준 집계) ──────────────────────────────────────────────

export interface InventorySkuSummary {
  skuId: number
  skuCode: string
  skuName: string
  unit: string | null
  totalQuantity: number
  availableQuantity: number
  allocatedQuantity: number
  defectiveQuantity: number
}

export function getInventories(params?: {
  skuId?: number
  warehouseId?: number
  keyword?: string
}) {
  return apiClient.get<ListData<InventorySkuSummary>>("/api/v1/inventory", {
    query: params,
  })
}

// ── 재고 (구역 × SKU 집계) ──────────────────────────────────────────────

export interface InventorySectionSummary extends InventorySkuSummary {
  warehouseId: number
  warehouseName: string
  sectionId: number
  sectionCode: string
  sectionName: string
  categoryId: number | null
  categoryName: string | null
}

/** 정렬 고정(창고→구역→SKU), 페이징 없음. 비담당 창고·구역은 403, 없는 필터 대상은 404. 카테고리는 하위 미포함. */
export function getInventoriesBySection(params?: {
  warehouseId?: number
  sectionId?: number
  categoryId?: number
  skuId?: number
  keyword?: string
}) {
  return apiClient.get<ListData<InventorySectionSummary>>(
    "/api/v1/inventory/by-section",
    { query: params }
  )
}

// ── 재고 (로트·구역 단위 상세) ──────────────────────────────────────────────

export interface InventoryLotView {
  inventoryLotId: number
  lotId: number
  lotNumber: string
  skuId: number
  skuCode: string
  skuName: string
  warehouseId: number
  sectionId: number
  sectionCode: string
  sectionName: string
  onHandQuantity: number
  allocatedQuantity: number
  availableQuantity: number
  qualityStatus: QualityStatus
  expiryDate: string | null
  lastCountedAt: string | null
}

export function getInventoriesByLot(params?: {
  skuId?: number
  warehouseId?: number
  sectionId?: number
  expiringBefore?: string
  qualityStatus?: QualityStatus
  includeEmpty?: boolean
}) {
  return apiClient.get<ListData<InventoryLotView>>("/api/v1/inventory/by-lot", {
    query: params,
  })
}

export interface InventoryDetail {
  inventoryLotId: number
  warehouseId: number
  warehouseName: string
  sectionId: number
  sectionCode: string
  sectionName: string
  skuId: number
  skuCode: string
  skuName: string
  unit: string | null
  lotId: number
  lotNumber: string
  supplierId: number | null
  manufacturedDate: string | null
  expiryDate: string | null
  lotStatus: LotStatus
  unitCost: number | null
  onHandQuantity: number
  allocatedQuantity: number
  availableQuantity: number
  qualityStatus: QualityStatus
  lastCountedAt: string | null
  createdAt: string
  updatedAt: string
}

export function getInventory(inventoryLotId: number) {
  return apiClient.get<InventoryDetail>(`/api/v1/inventory/${inventoryLotId}`)
}

// ── 재고 부족 ──────────────────────────────────────────────

export interface LowStockItem {
  skuId: number
  skuCode: string
  skuName: string
  unit: string | null
  safetyStockQuantity: number
  availableQuantity: number
  shortageQuantity: number
}

export function getLowStock(params?: {
  warehouseId?: number
  keyword?: string
}) {
  return apiClient.get<ListData<LowStockItem>>("/api/v1/inventory/low-stock", {
    query: params,
  })
}

// ── 재고 트랜잭션 ──────────────────────────────────────────────

export interface InventoryTransaction {
  transactionId: number
  inventoryLotId: number
  warehouseId: number
  sectionId: number
  sectionCode: string
  skuId: number
  skuCode: string
  lotId: number
  lotNumber: string
  transactionType: TransactionType
  quantityDelta: number
  beforeQuantity: number
  afterQuantity: number
  referenceType: ReferenceType | null
  referenceId: number | null
  reason: string | null
  createdBy: number | null
  createdAt: string
}

export function getTransactions(params?: {
  warehouseId?: number
  sectionId?: number
  skuId?: number
  lotId?: number
  transactionType?: TransactionType
  referenceType?: ReferenceType
  referenceId?: number
  createdFrom?: string
  createdTo?: string
}) {
  return apiClient.get<ListData<InventoryTransaction>>(
    "/api/v1/inventory/transactions",
    {
      query: params,
    }
  )
}

export function getTransactionsOf(
  inventoryLotId: number,
  params?: {
    transactionType?: TransactionType
    createdFrom?: string
    createdTo?: string
  }
) {
  return apiClient.get<{
    inventoryLotId: number
    items: InventoryTransaction[]
  }>(`/api/v1/inventory/${inventoryLotId}/transactions`, { query: params })
}

// ── 재고 조정 ──────────────────────────────────────────────

export interface InventoryAdjustInput {
  inventoryLotId: number
  beforeQuantity: number
  afterQuantity: number
  reason: string
}

export interface InventoryAdjustmentResult {
  transactionId: number
  inventoryLotId: number
  transactionType: TransactionType
  quantityDelta: number
  beforeQuantity: number
  afterQuantity: number
  reason: string
  createdBy: number
  createdAt: string
  inventory: {
    onHandQuantity: number
    allocatedQuantity: number
    availableQuantity: number
  }
}

/** 처리자는 서버가 토큰에서 채운다. */
export function adjustInventory(body: InventoryAdjustInput) {
  return apiClient.post<InventoryAdjustmentResult>(
    "/api/v1/inventory/adjustments",
    body
  )
}

// ── 로트 ──────────────────────────────────────────────

export interface LotSummary {
  lotId: number
  lotNumber: string
  skuId: number
  skuCode: string
  skuName: string
  supplierId: number | null
  manufacturedDate: string | null
  expiryDate: string | null
  status: LotStatus
  unitCost: number | null
}

export function getLots(params?: {
  skuId?: number
  supplierId?: number
  expiringBefore?: string
  keyword?: string
}) {
  return apiClient.get<ListData<LotSummary>>("/api/v1/lots", { query: params })
}

export interface LotDetail extends LotSummary {
  inventory: {
    inventoryLotId: number
    warehouseId: number
    warehouseName: string
    sectionId: number
    sectionCode: string
    sectionName: string
    onHandQuantity: number
    allocatedQuantity: number
    qualityStatus: QualityStatus
  }[]
  /** 이 로트가 들어온 입고 이력(InboundLine 기준). 원가 정보라 점주 응답에서는 빠진다. */
  inbounds: {
    inboundId: number
    inboundNo: string
    warehouseId: number
    receivedAt: string | null
    receivedQuantity: number
    acceptedQuantity: number
    defectiveQuantity: number
    receivedUnitPrice: number | null
  }[]
  createdAt: string
  updatedAt: string
}

export function getLot(lotId: number) {
  return apiClient.get<LotDetail>(`/api/v1/lots/${lotId}`)
}

/**
 * 로트 상태 변경(본사 관리자만). 격리는 할당 0일 때, 해제는 유통기한 전일 때, 폐기는 보유·할당 0일 때만 가능하다.
 * 위반하면 409 `LOT_HAS_ALLOCATION`·`LOT_HAS_STOCK`·`INVALID_LOT_STATUS_TRANSITION`. `EXPIRED`로는 바꿀 수 없다(400).
 */
export function changeLotStatus(
  lotId: number,
  body: { status: Exclude<LotStatus, "EXPIRED">; reason: string }
) {
  return apiClient.patch<LotSummary>(`/api/v1/lots/${lotId}/status`, body)
}

import { useState } from "react"
import { X } from "lucide-react"

import { Pager, SortableHead, usePaging } from "~/components/common/list-paging"
import { ReasonDialog } from "~/components/common/reason-dialog"
import { StatusBadge } from "~/components/common/status-badge"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Select } from "~/components/ui/select"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { useInitialParam } from "~/lib/use-initial-param"
import { getErrorMessage } from "~/lib/api/error-messages"
import { getRoleLabel, useCurrentUser } from "~/lib/current-user"
import { useCategories } from "~/features/product/hooks"
import { formatDateTime } from "~/features/purchase-order/format"
import { useSelectableWarehouses } from "~/features/purchase-order/hooks"
import { useSectionsByWarehouse } from "~/features/warehouse/hooks"
import type {
  InventorySectionSummary,
  InventoryLotView,
  InventorySkuSummary,
  LotStatus,
  LotSummary,
  LowStockItem,
} from "~/lib/api/inventory"

import {
  useAdjustInventory,
  useChangeLotStatus,
  useInventoriesByLot,
  useInventoriesBySection,
  useInventories,
  useLots,
  useLowStock,
} from "./hooks"

type Paging = ReturnType<typeof usePaging>

type Tab = "by-section" | "summary" | "low-stock" | "by-lot" | "lots"

const tabs: { key: Tab; label: string }[] = [
  { key: "by-section", label: "구역별 재고" },
  { key: "summary", label: "전체 재고" },
  { key: "low-stock", label: "재고 부족" },
  { key: "by-lot", label: "로트별 재고" },
  { key: "lots", label: "로트 마스터" },
]

export function InventoryPage() {
  const initialTab = useInitialParam(
    "tab",
    tabs.map((t) => t.key)
  )
  const [tab, setTab] = useState<Tab>((initialTab || "by-section") as Tab)
  const [keyword, setKeyword] = useState("")
  // 대시보드에서 넘어온 창고·유통기한 조건. 재고 부족·로트별 탭에 적용한다.
  const [warehouseId, setWarehouseId] = useState(useInitialParam("warehouseId"))
  const [expiringBefore, setExpiringBefore] = useState(
    useInitialParam("expiringBefore")
  )
  const warehouses = useSelectableWarehouses()
  const [adjustTarget, setAdjustTarget] = useState<InventoryLotView | null>(
    null
  )

  const keywordFilter = { keyword: keyword || undefined }
  const summaryPaging = usePaging(JSON.stringify(keywordFilter))
  const lotsPaging = usePaging(JSON.stringify(keywordFilter))
  const byLotPaging = usePaging(`${warehouseId}|${expiringBefore}`)
  const summaryQuery = useInventories({
    ...keywordFilter,
    ...summaryPaging.params,
  })
  const lowStockQuery = useLowStock({
    ...keywordFilter,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
  })
  const byLotQuery = useInventoriesByLot({
    ...byLotPaging.params,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    expiringBefore: expiringBefore || undefined,
  })
  const lotsQuery = useLots({ ...keywordFilter, ...lotsPaging.params })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
        {(tab === "low-stock" || tab === "by-lot") && (
          <div className="ml-auto flex items-center gap-2">
            {tab === "by-lot" && expiringBefore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpiringBefore("")}
              >
                유통기한 {expiringBefore}까지 ✕
              </Button>
            )}
            <div className="w-44">
              <Select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">전체 창고</option>
                {warehouses.map((w) => (
                  <option key={w.warehouseId} value={w.warehouseId}>
                    {w.warehouseName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}
        {tab !== "by-section" && tab !== "by-lot" && (
          <div className={tab === "low-stock" ? "w-56" : "ml-auto w-56"}>
            <Input
              placeholder="SKU 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        )}
      </div>

      {adjustTarget && (
        <InventoryAdjustForm
          target={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      <Card
        key={tab}
        className="animate-in duration-200 fade-in-0 motion-reduce:animate-none"
      >
        <CardHeader>
          <CardTitle>{tabs.find((t) => t.key === tab)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {tab === "by-section" && <BySectionPanel />}
          {tab === "summary" && (
            <SummaryTable query={summaryQuery} paging={summaryPaging} />
          )}
          {tab === "low-stock" && <LowStockTable query={lowStockQuery} />}
          {tab === "by-lot" && (
            <ByLotTable
              query={byLotQuery}
              paging={byLotPaging}
              onAdjust={setAdjustTarget}
            />
          )}
          {tab === "lots" && (
            <LotsTable query={lotsQuery} paging={lotsPaging} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 로딩/에러/빈 목록 상태를 렌더링할 JSX(또는 정상 상태면 null)를 반환한다.
 * JSX 컴포넌트가 아니라 일반 함수로 호출해야 한다 — <Comp/> 형태로 쓰면 항상 truthy한
 * React 엘리먼트가 되어 "값이 있으면 그 상태를 보여주고 없으면 표를 그린다" 분기가 깨진다.
 */
function queryState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyMessage,
}: {
  isLoading: boolean
  isError: boolean
  error: unknown
  isEmpty: boolean
  emptyMessage: string
}) {
  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        불러오는 중...
      </p>
    )
  }
  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        {getErrorMessage(error, "목록을 불러오지 못했습니다.")}
      </p>
    )
  }
  if (isEmpty) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }
  return null
}

function BySectionPanel() {
  const warehouses = useSelectableWarehouses()
  const categories = useCategories()
  // 창고 상세의 구역 링크에서 넘어온 창고·구역을 초기 필터로 쓴다.
  const initialWarehouseId = useInitialParam("warehouseId")
  const initialSectionId = useInitialParam("sectionId")
  const [draft, setDraft] = useState({
    warehouseId: initialWarehouseId,
    sectionId: initialWarehouseId ? initialSectionId : "",
    categoryId: "",
    keyword: "",
  })
  const [lotTarget, setLotTarget] = useState<InventorySectionSummary | null>(
    null
  )

  const sections = useSectionsByWarehouse(
    draft.warehouseId ? Number(draft.warehouseId) : null
  )
  const filters = {
    warehouseId: draft.warehouseId ? Number(draft.warehouseId) : undefined,
    sectionId: draft.sectionId ? Number(draft.sectionId) : undefined,
    categoryId: draft.categoryId ? Number(draft.categoryId) : undefined,
    keyword: draft.keyword.trim() || undefined,
  }
  const paging = usePaging(JSON.stringify(filters))
  const query = useInventoriesBySection({ ...filters, ...paging.params })
  const items: InventorySectionSummary[] = query.data?.items ?? []
  const pageInfo = query.data?.pageInfo
  const sort = pageInfo?.sort
  const onSort = paging.toggleSort

  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: (pageInfo?.totalElements ?? items.length) === 0,
    emptyMessage: "조건에 맞는 재고가 없습니다.",
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-44">
          <Label>창고</Label>
          <Select
            value={draft.warehouseId}
            onChange={(e) =>
              setDraft({ ...draft, warehouseId: e.target.value, sectionId: "" })
            }
          >
            <option value="">전체</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.warehouseName}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Label>구역</Label>
          <Select
            value={draft.sectionId}
            disabled={!draft.warehouseId}
            onChange={(e) => setDraft({ ...draft, sectionId: e.target.value })}
          >
            <option value="">전체</option>
            {(sections.data?.items ?? []).map((s) => (
              <option key={s.sectionId} value={s.sectionId}>
                {s.sectionCode} · {s.sectionName}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <Label htmlFor="by-section-keyword">SKU 검색</Label>
          <Input
            id="by-section-keyword"
            placeholder="SKU 코드·이름"
            value={draft.keyword}
            onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
          />
        </div>
        <div className="w-44">
          <Label>카테고리</Label>
          <Select
            value={draft.categoryId}
            onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
          >
            <option value="">전체</option>
            {(categories.data?.items ?? []).map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        카테고리는 선택한 카테고리와 정확히 일치하는 SKU만 조회됩니다(하위
        카테고리 미포함). 행을 누르면 로트별 재고를 볼 수 있습니다.
      </p>
      {state ?? (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="warehouseName" sort={sort} onSort={onSort}>
                창고
              </SortableHead>
              <SortableHead field="sectionCode" sort={sort} onSort={onSort}>
                구역
              </SortableHead>
              <SortableHead field="skuCode" sort={sort} onSort={onSort}>
                SKU
              </SortableHead>
              <TableHead>단위</TableHead>
              <SortableHead field="categoryName" sort={sort} onSort={onSort}>
                카테고리
              </SortableHead>
              <SortableHead
                field="totalQuantity"
                sort={sort}
                onSort={onSort}
                className="text-right"
              >
                보유
              </SortableHead>
              <SortableHead
                field="availableQuantity"
                sort={sort}
                onSort={onSort}
                className="text-right"
              >
                가용
              </SortableHead>
              <SortableHead
                field="allocatedQuantity"
                sort={sort}
                onSort={onSort}
                className="text-right"
              >
                할당
              </SortableHead>
              <SortableHead
                field="defectiveQuantity"
                sort={sort}
                onSort={onSort}
                className="text-right"
              >
                불량
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const key = `${item.sectionId}-${item.skuId}`
              return (
                <TableRow
                  key={key}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setLotTarget(item)}
                >
                  <TableCell>{item.warehouseName}</TableCell>
                  <TableCell>
                    {item.sectionCode} · {item.sectionName}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="block font-mono text-xs font-normal text-muted-foreground">
                      {item.skuCode}
                    </span>
                    {item.skuName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.unit ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.categoryName ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.totalQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.availableQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.allocatedQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.defectiveQuantity}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
      {pageInfo && pageInfo.totalElements > 0 && (
        <Pager
          pageInfo={pageInfo}
          onPage={paging.setPage}
          onSize={paging.setSize}
        />
      )}
      <Dialog
        open={lotTarget !== null}
        onOpenChange={(open) => !open && setLotTarget(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              로트별 재고
              {lotTarget &&
                ` · ${lotTarget.skuName} (${lotTarget.sectionCode})`}
            </DialogTitle>
            {lotTarget && (
              <DialogDescription className="font-mono text-xs">
                {lotTarget.skuCode}
              </DialogDescription>
            )}
          </DialogHeader>
          {lotTarget && <SectionLots item={lotTarget} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionLots({ item }: { item: InventorySectionSummary }) {
  const query = useInventoriesByLot({
    warehouseId: item.warehouseId,
    sectionId: item.sectionId,
    skuId: item.skuId,
    size: 100,
  })
  const lots = query.data?.items ?? []
  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: lots.length === 0,
    emptyMessage: "로트별 재고가 없습니다.",
  })
  if (state) return state

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>로트 번호</TableHead>
          <TableHead>품질</TableHead>
          <TableHead>유효기한</TableHead>
          <TableHead className="text-right">보유</TableHead>
          <TableHead className="text-right">할당</TableHead>
          <TableHead className="text-right">가용</TableHead>
          <TableHead>최근 실사</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot) => (
          <TableRow key={lot.inventoryLotId}>
            <TableCell className="font-mono text-xs">{lot.lotNumber}</TableCell>
            <TableCell>
              <Badge
                variant={
                  lot.qualityStatus === "AVAILABLE" ? "outline" : "destructive"
                }
              >
                {lot.qualityStatus === "AVAILABLE" ? "가용" : "불량"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {lot.expiryDate ?? "-"}
            </TableCell>
            <TableCell className="text-right">{lot.onHandQuantity}</TableCell>
            <TableCell className="text-right">
              {lot.allocatedQuantity}
            </TableCell>
            <TableCell className="text-right">
              {lot.availableQuantity}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(lot.lastCountedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SummaryTable({
  query,
  paging,
}: {
  query: ReturnType<typeof useInventories>
  paging: Paging
}) {
  const items: InventorySkuSummary[] = query.data?.items ?? []
  const pageInfo = query.data?.pageInfo
  const sort = pageInfo?.sort
  const onSort = paging.toggleSort
  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: (pageInfo?.totalElements ?? items.length) === 0,
    emptyMessage: "재고 데이터가 없습니다.",
  })
  if (state) return state

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="skuCode" sort={sort} onSort={onSort}>
              SKU
            </SortableHead>
            <TableHead>단위</TableHead>
            <SortableHead
              field="totalQuantity"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              총 수량
            </SortableHead>
            <SortableHead
              field="availableQuantity"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              가용
            </SortableHead>
            <SortableHead
              field="allocatedQuantity"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              할당
            </SortableHead>
            <SortableHead
              field="defectiveQuantity"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              불량
            </SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.skuId}>
              <TableCell className="font-medium">
                <span className="block font-mono text-xs font-normal text-muted-foreground">
                  {item.skuCode}
                </span>
                {item.skuName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.unit ?? "-"}
              </TableCell>
              <TableCell className="text-right">{item.totalQuantity}</TableCell>
              <TableCell className="text-right">
                {item.availableQuantity}
              </TableCell>
              <TableCell className="text-right">
                {item.allocatedQuantity}
              </TableCell>
              <TableCell className="text-right">
                {item.defectiveQuantity}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pageInfo && pageInfo.totalElements > 0 && (
        <Pager
          pageInfo={pageInfo}
          onPage={paging.setPage}
          onSize={paging.setSize}
        />
      )}
    </>
  )
}

function LowStockTable({ query }: { query: ReturnType<typeof useLowStock> }) {
  const items: LowStockItem[] = query.data?.items ?? []
  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: items.length === 0,
    emptyMessage: "재고 부족 품목이 없습니다.",
  })
  if (state) return state

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>단위</TableHead>
          <TableHead className="text-right">안전 재고</TableHead>
          <TableHead className="text-right">가용 수량</TableHead>
          <TableHead className="text-right">부족 수량</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.skuId}>
            <TableCell className="font-medium">
              <span className="block font-mono text-xs font-normal text-muted-foreground">
                {item.skuCode}
              </span>
              {item.skuName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.unit ?? "-"}
            </TableCell>
            <TableCell className="text-right">
              {item.safetyStockQuantity}
            </TableCell>
            <TableCell className="text-right">
              {item.availableQuantity}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="destructive">{item.shortageQuantity}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ByLotTable({
  query,
  paging,
  onAdjust,
}: {
  query: ReturnType<typeof useInventoriesByLot>
  paging: Paging
  onAdjust: (target: InventoryLotView) => void
}) {
  const items: InventoryLotView[] = query.data?.items ?? []
  const pageInfo = query.data?.pageInfo
  const sort = pageInfo?.sort
  const onSort = paging.toggleSort
  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: (pageInfo?.totalElements ?? items.length) === 0,
    emptyMessage: "로트별 재고 데이터가 없습니다.",
  })
  if (state) return state

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="lotNumber" sort={sort} onSort={onSort}>
              로트 번호
            </SortableHead>
            <SortableHead field="skuCode" sort={sort} onSort={onSort}>
              SKU
            </SortableHead>
            <SortableHead field="sectionCode" sort={sort} onSort={onSort}>
              구역
            </SortableHead>
            <SortableHead
              field="onHandQuantity"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              보유
            </SortableHead>
            <SortableHead
              field="allocatedQuantity"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              할당
            </SortableHead>
            <SortableHead
              field="availableQuantity"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              가용
            </SortableHead>
            <SortableHead field="qualityStatus" sort={sort} onSort={onSort}>
              품질
            </SortableHead>
            <SortableHead field="expiryDate" sort={sort} onSort={onSort}>
              유효기한
            </SortableHead>
            <SortableHead field="lastCountedAt" sort={sort} onSort={onSort}>
              최근 실사
            </SortableHead>
            <TableHead className="w-px" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.inventoryLotId}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {item.lotNumber}
              </TableCell>
              <TableCell className="font-medium">{item.skuName}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.sectionName}
              </TableCell>
              <TableCell className="text-right">
                {item.onHandQuantity}
              </TableCell>
              <TableCell className="text-right">
                {item.allocatedQuantity}
              </TableCell>
              <TableCell className="text-right">
                {item.availableQuantity}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    item.qualityStatus === "AVAILABLE"
                      ? "outline"
                      : "destructive"
                  }
                >
                  {item.qualityStatus === "AVAILABLE" ? "가용" : "불량"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.expiryDate ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(item.lastCountedAt)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdjust(item)}
                >
                  조정
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pageInfo && pageInfo.totalElements > 0 && (
        <Pager
          pageInfo={pageInfo}
          onPage={paging.setPage}
          onSize={paging.setSize}
        />
      )}
    </>
  )
}

/** 현재 상태에서 가능한 전이(서버 docs/api/inventory.md). EXPIRED로의 변경은 없다. */
const LOT_TRANSITIONS: Record<
  LotStatus,
  { to: "AVAILABLE" | "QUARANTINED" | "DISPOSED"; label: string }[]
> = {
  AVAILABLE: [
    { to: "QUARANTINED", label: "격리" },
    { to: "DISPOSED", label: "폐기" },
  ],
  QUARANTINED: [
    { to: "AVAILABLE", label: "격리 해제" },
    { to: "DISPOSED", label: "폐기" },
  ],
  EXPIRED: [{ to: "DISPOSED", label: "폐기" }],
  DISPOSED: [],
}

function LotsTable({
  query,
  paging,
}: {
  query: ReturnType<typeof useLots>
  paging: Paging
}) {
  const { role } = useCurrentUser()
  const changeStatus = useChangeLotStatus()
  const [target, setTarget] = useState<{
    lot: LotSummary
    to: "AVAILABLE" | "QUARANTINED" | "DISPOSED"
    label: string
  } | null>(null)
  const canChange = role === "HQ_ADMIN"

  const items: LotSummary[] = query.data?.items ?? []
  const pageInfo = query.data?.pageInfo
  const sort = pageInfo?.sort
  const onSort = paging.toggleSort
  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: (pageInfo?.totalElements ?? items.length) === 0,
    emptyMessage: "등록된 로트가 없습니다.",
  })
  if (state) return state

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="lotNumber" sort={sort} onSort={onSort}>
              로트 번호
            </SortableHead>
            <SortableHead field="skuCode" sort={sort} onSort={onSort}>
              SKU
            </SortableHead>
            <TableHead>제조일</TableHead>
            <SortableHead field="expiryDate" sort={sort} onSort={onSort}>
              유효기한
            </SortableHead>
            <SortableHead field="status" sort={sort} onSort={onSort}>
              상태
            </SortableHead>
            <SortableHead
              field="unitCost"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              단가
            </SortableHead>
            {canChange && <TableHead className="w-px" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((lot) => (
            <TableRow key={lot.lotId}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {lot.lotNumber}
              </TableCell>
              <TableCell className="font-medium">{lot.skuName}</TableCell>
              <TableCell className="text-muted-foreground">
                {lot.manufacturedDate ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lot.expiryDate ?? "-"}
              </TableCell>
              <TableCell>
                <StatusBadge status={lot.status} />
              </TableCell>
              <TableCell className="text-right">
                {lot.unitCost ?? "-"}
              </TableCell>
              {canChange && (
                <TableCell className="space-x-1 text-right">
                  {LOT_TRANSITIONS[lot.status].map((t) => (
                    <Button
                      key={t.to}
                      variant={t.to === "DISPOSED" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => {
                        changeStatus.reset()
                        setTarget({ lot, to: t.to, label: t.label })
                      }}
                    >
                      {t.label}
                    </Button>
                  ))}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pageInfo && pageInfo.totalElements > 0 && (
        <Pager
          pageInfo={pageInfo}
          onPage={paging.setPage}
          onSize={paging.setSize}
        />
      )}
      <ReasonDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={`로트 ${target?.label ?? ""}`}
        description={
          target
            ? `${target.lot.lotNumber} (${target.lot.skuName}) 로트를 ${target.label}합니다.${
                target.to === "DISPOSED"
                  ? " 폐기는 되돌릴 수 없고, 보유·할당 수량이 0일 때만 가능합니다."
                  : ""
              }`
            : undefined
        }
        submitLabel={target?.label}
        destructive={target?.to === "DISPOSED"}
        isPending={changeStatus.isPending}
        error={
          changeStatus.isError
            ? getErrorMessage(changeStatus.error, "상태 변경에 실패했습니다.")
            : null
        }
        onSubmit={(reason) => {
          if (!target) return
          changeStatus.mutate(
            { lotId: target.lot.lotId, body: { status: target.to, reason } },
            { onSuccess: () => setTarget(null) }
          )
        }}
      />
    </>
  )
}

/**
 * 재고 조정 폼. 처리자는 서버가 토큰에서 채우고, 화면에는 현재 사용자를 보여 준다.
 * 재고 조정은 창고 관리자 권한이다(서버의 역할 검사는 인증 연동 후 적용).
 */
function InventoryAdjustForm({
  target,
  onClose,
}: {
  target: InventoryLotView
  onClose: () => void
}) {
  const adjustInventory = useAdjustInventory()
  const [afterQuantity, setAfterQuantity] = useState(
    String(target.onHandQuantity)
  )
  const [reason, setReason] = useState("")
  const { name, role } = useCurrentUser()

  const canSubmit = afterQuantity !== "" && reason.trim() !== ""

  function handleSubmit() {
    if (!canSubmit) return
    adjustInventory.mutate(
      {
        body: {
          inventoryLotId: target.inventoryLotId,
          beforeQuantity: target.onHandQuantity,
          afterQuantity: Number(afterQuantity),
          reason,
        },
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          재고 조정 · {target.lotNumber} / {target.skuName}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="닫기"
        >
          <X />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>현재 보유 수량</Label>
          <p className="py-2 text-sm">{target.onHandQuantity}</p>
        </div>
        <div>
          <Label htmlFor="adjust-after">조정 후 수량</Label>
          <Input
            id="adjust-after"
            type="number"
            value={afterQuantity}
            onChange={(e) => setAfterQuantity(e.target.value)}
          />
        </div>
        <div>
          <Label>처리자</Label>
          <p className="py-2 text-sm">
            {getRoleLabel(role)} {name}
          </p>
          {role !== "WAREHOUSE_MANAGER" && (
            <p className="text-xs text-muted-foreground">
              재고 조정은 창고 관리자 권한입니다.
            </p>
          )}
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="adjust-reason">조정 사유</Label>
          <Textarea
            id="adjust-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {adjustInventory.isError && (
          <p className="text-sm text-destructive sm:col-span-3">
            {getErrorMessage(adjustInventory.error, "조정에 실패했습니다.")}
          </p>
        )}
        <div className="sm:col-span-3">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || adjustInventory.isPending}
          >
            {adjustInventory.isPending ? "처리 중..." : "조정 적용"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

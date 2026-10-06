import { useState } from "react"
import { X } from "lucide-react"

import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
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
import { getErrorMessage } from "~/lib/api/error-messages"
import { getRoleLabel, useCurrentUser } from "~/lib/current-user"
import type {
  InventoryLotView,
  InventorySkuSummary,
  LotSummary,
  LowStockItem,
} from "~/lib/api/inventory"

import {
  useAdjustInventory,
  useInventoriesByLot,
  useInventories,
  useLots,
  useLowStock,
} from "./hooks"

type Tab = "summary" | "low-stock" | "by-lot" | "lots"

const tabs: { key: Tab; label: string }[] = [
  { key: "summary", label: "전체 재고" },
  { key: "low-stock", label: "재고 부족" },
  { key: "by-lot", label: "로트별 재고" },
  { key: "lots", label: "로트 마스터" },
]

export function InventoryPage() {
  const [tab, setTab] = useState<Tab>("summary")
  const [keyword, setKeyword] = useState("")
  const [adjustTarget, setAdjustTarget] = useState<InventoryLotView | null>(
    null
  )

  const summaryQuery = useInventories({ keyword: keyword || undefined })
  const lowStockQuery = useLowStock({ keyword: keyword || undefined })
  const byLotQuery = useInventoriesByLot()
  const lotsQuery = useLots({ keyword: keyword || undefined })

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
        <div className="ml-auto w-56">
          <Input
            placeholder="SKU 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      {adjustTarget && (
        <InventoryAdjustForm
          target={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tabs.find((t) => t.key === tab)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {tab === "summary" && <SummaryTable query={summaryQuery} />}
          {tab === "low-stock" && <LowStockTable query={lowStockQuery} />}
          {tab === "by-lot" && (
            <ByLotTable query={byLotQuery} onAdjust={setAdjustTarget} />
          )}
          {tab === "lots" && <LotsTable query={lotsQuery} />}
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

function SummaryTable({ query }: { query: ReturnType<typeof useInventories> }) {
  const items: InventorySkuSummary[] = query.data?.items ?? []
  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: items.length === 0,
    emptyMessage: "재고 데이터가 없습니다.",
  })
  if (state) return state

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU 코드</TableHead>
          <TableHead>SKU명</TableHead>
          <TableHead>단위</TableHead>
          <TableHead className="text-right">총 수량</TableHead>
          <TableHead className="text-right">가용</TableHead>
          <TableHead className="text-right">할당</TableHead>
          <TableHead className="text-right">불량</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.skuId}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {item.skuCode}
            </TableCell>
            <TableCell className="font-medium">{item.skuName}</TableCell>
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
          <TableHead>SKU 코드</TableHead>
          <TableHead>SKU명</TableHead>
          <TableHead>단위</TableHead>
          <TableHead className="text-right">안전 재고</TableHead>
          <TableHead className="text-right">가용 수량</TableHead>
          <TableHead className="text-right">부족 수량</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.skuId}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {item.skuCode}
            </TableCell>
            <TableCell className="font-medium">{item.skuName}</TableCell>
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
  onAdjust,
}: {
  query: ReturnType<typeof useInventoriesByLot>
  onAdjust: (target: InventoryLotView) => void
}) {
  const items: InventoryLotView[] = query.data?.items ?? []
  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: items.length === 0,
    emptyMessage: "로트별 재고 데이터가 없습니다.",
  })
  if (state) return state

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>로트 번호</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>구역</TableHead>
          <TableHead className="text-right">보유</TableHead>
          <TableHead className="text-right">할당</TableHead>
          <TableHead className="text-right">가용</TableHead>
          <TableHead>품질</TableHead>
          <TableHead>유효기한</TableHead>
          <TableHead />
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
            <TableCell className="text-right">{item.onHandQuantity}</TableCell>
            <TableCell className="text-right">
              {item.allocatedQuantity}
            </TableCell>
            <TableCell className="text-right">
              {item.availableQuantity}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  item.qualityStatus === "AVAILABLE" ? "outline" : "destructive"
                }
              >
                {item.qualityStatus === "AVAILABLE" ? "가용" : "불량"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.expiryDate ?? "-"}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onAdjust(item)}>
                조정
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function LotsTable({ query }: { query: ReturnType<typeof useLots> }) {
  const items: LotSummary[] = query.data?.items ?? []
  const state = queryState({
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: items.length === 0,
    emptyMessage: "등록된 로트가 없습니다.",
  })
  if (state) return state

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>로트 번호</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>제조일</TableHead>
          <TableHead>유효기한</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">단가</TableHead>
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
              <Badge
                variant={lot.status === "AVAILABLE" ? "outline" : "destructive"}
              >
                {lot.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{lot.unitCost ?? "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * 재고 조정 폼. 인증이 아직 없어 처리자 userId는 현재 사용자 모듈(useCurrentUser)의 값을 쓴다.
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
  const { userId, role } = useCurrentUser()

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
        userId,
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
            {getRoleLabel(role)} #{userId}
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

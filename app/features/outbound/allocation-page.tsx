import { useState } from "react"
import { Link, useSearchParams } from "react-router"

import { ReasonDialog } from "~/components/common/reason-dialog"
import { StatusBadge } from "~/components/common/status-badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { formatDateTime } from "~/features/purchase-order/format"
import { useSelectableWarehouses } from "~/features/purchase-order/hooks"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { Allocation, AllocationStatus } from "~/lib/api/outbound"
import { useCurrentUser } from "~/lib/current-user"

import { useAllocations, useReleaseAllocation } from "./hooks"

const STATUS_OPTIONS: { value: AllocationStatus; label: string }[] = [
  { value: "ALLOCATED", label: "할당" },
  { value: "PICKED", label: "피킹 완료" },
  { value: "RELEASED", label: "해제" },
]

/** 재고 할당 목록. 발주 상세에서 `?storeOrderId=`로 넘어오면 그 발주의 할당만 본다. */
export function AllocationPage() {
  const { role } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const storeOrderId = searchParams.get("storeOrderId")

  const [status, setStatus] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [keyword, setKeyword] = useState("")
  const [releasing, setReleasing] = useState<Allocation | null>(null)
  const release = useReleaseAllocation()

  const warehouses = useSelectableWarehouses()
  const query = useAllocations({
    storeOrderId: storeOrderId ? Number(storeOrderId) : undefined,
    status: (status || undefined) as AllocationStatus | undefined,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    keyword: keyword || undefined,
  })
  const allocations = query.data?.items ?? []

  if (role === "STORE_OWNER") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        재고 할당은 본사 관리자와 창고 관리자만 볼 수 있습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>재고 할당 목록</CardTitle>
          <p className="text-sm text-muted-foreground">
            할당은 지점 발주 상세에서 합니다. 출고에 묶이기 전 할당만 해제할 수
            있습니다.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            {storeOrderId && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  발주 #{storeOrderId}만 표시 중
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchParams({})}
                >
                  전체 보기
                </Button>
              </div>
            )}
            <div className="w-56">
              <Label htmlFor="alloc-keyword">검색어</Label>
              <Input
                id="alloc-keyword"
                placeholder="발주 번호·SKU 코드·로트 번호"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="alloc-warehouse">창고</Label>
              <Select
                id="alloc-warehouse"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">전체</option>
                {warehouses.map((w) => (
                  <option key={w.warehouseId} value={w.warehouseId}>
                    {w.warehouseName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-32">
              <Label htmlFor="alloc-status">상태</Label>
              <Select
                id="alloc-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">전체</option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {query.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(query.error, "목록을 불러오지 못했습니다.")}
            </p>
          )}
          {!query.isLoading && !query.isError && (
            <AllocationTable
              allocations={allocations}
              warehouses={warehouses}
              canRelease={role === "WAREHOUSE_MANAGER"}
              onRelease={(a) => {
                release.reset()
                setReleasing(a)
              }}
            />
          )}
        </CardContent>
      </Card>

      <ReasonDialog
        open={releasing !== null}
        onOpenChange={(open) => !open && setReleasing(null)}
        title="재고 할당 해제"
        description="예약했던 재고를 다시 가용 재고로 돌립니다. 출고에 묶인 할당은 해제할 수 없으니, 먼저 출고를 취소해 주세요."
        submitLabel="해제"
        destructive
        isPending={release.isPending}
        error={
          release.isError
            ? getErrorMessage(release.error, "해제에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          releasing &&
          release.mutate(
            { allocationId: releasing.allocationId, reason },
            { onSuccess: () => setReleasing(null) }
          )
        }
      />
    </div>
  )
}

function AllocationTable({
  allocations,
  warehouses,
  canRelease,
  onRelease,
}: {
  allocations: Allocation[]
  warehouses: { warehouseId: number; warehouseName: string }[]
  canRelease: boolean
  onRelease: (allocation: Allocation) => void
}) {
  if (allocations.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 재고 할당이 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>발주</TableHead>
          <TableHead>창고</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>로트</TableHead>
          <TableHead>유통기한</TableHead>
          <TableHead>구역</TableHead>
          <TableHead className="text-right">할당</TableHead>
          <TableHead className="text-right">피킹</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>할당일시</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {allocations.map((a) => (
          <TableRow key={a.allocationId}>
            <TableCell className="font-mono text-xs">
              <Link
                className="underline underline-offset-2"
                to={`/store-orders/${a.storeOrderId}`}
              >
                {a.orderNo}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {warehouses.find((w) => w.warehouseId === a.warehouseId)
                ?.warehouseName ?? `#${a.warehouseId}`}
            </TableCell>
            <TableCell>
              <span className="block font-mono text-xs text-muted-foreground">
                {a.skuCode}
              </span>
              {a.skuName}
            </TableCell>
            <TableCell className="font-mono text-xs">{a.lotNumber}</TableCell>
            <TableCell className="text-muted-foreground">
              {a.expiryDate ?? "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {a.sectionCode}
            </TableCell>
            <TableCell className="text-right">{a.allocatedQuantity}</TableCell>
            <TableCell className="text-right">{a.pickedQuantity}</TableCell>
            <TableCell>
              <StatusBadge status={a.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(a.allocatedAt)}
            </TableCell>
            <TableCell>
              {canRelease && a.status === "ALLOCATED" && (
                <Button variant="ghost" size="sm" onClick={() => onRelease(a)}>
                  해제
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

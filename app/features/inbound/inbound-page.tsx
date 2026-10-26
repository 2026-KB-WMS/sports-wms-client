import { useState } from "react"

import { Pager, SortableHead, usePaging } from "~/components/common/list-paging"
import { LinkRow } from "~/components/common/link-row"
import { StatusBadge } from "~/components/common/status-badge"
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
import { useSelectableWarehouses } from "~/features/purchase-order/hooks"
import { formatDateTime } from "~/features/purchase-order/format"
import { useInitialParam } from "~/lib/use-initial-param"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { InboundListItem, InboundStatus } from "~/lib/api/inbound"
import { useCurrentUser } from "~/lib/current-user"

import { useInbounds } from "./hooks"

const STATUS_OPTIONS: { value: InboundStatus; label: string }[] = [
  { value: "ARRIVED", label: "도착" },
  { value: "INSPECTING", label: "검수 중" },
  { value: "COMPLETED", label: "입고 완료" },
  { value: "CANCELED", label: "취소" },
]

export function InboundPage() {
  const { role } = useCurrentUser()
  const initialStatus = useInitialParam(
    "status",
    STATUS_OPTIONS.map((o) => o.value)
  )
  const [status, setStatus] = useState(initialStatus)
  const [warehouseId, setWarehouseId] = useState(useInitialParam("warehouseId"))
  const [keyword, setKeyword] = useState("")
  const [arrivedFrom, setArrivedFrom] = useState("")
  const [arrivedTo, setArrivedTo] = useState("")

  const warehouses = useSelectableWarehouses()
  const filters = {
    status: (status || undefined) as InboundStatus | undefined,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    keyword: keyword || undefined,
    // 양 끝 포함 조건이라 종료일은 그날 마지막 시각으로 보낸다.
    arrivedFrom: arrivedFrom ? `${arrivedFrom}T00:00:00` : undefined,
    arrivedTo: arrivedTo ? `${arrivedTo}T23:59:59` : undefined,
  }
  const paging = usePaging(JSON.stringify(filters))
  const query = useInbounds({ ...filters, ...paging.params })
  const inbounds = query.data?.items ?? []
  const pageInfo = query.data?.pageInfo

  if (role === "STORE_OWNER") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        입고는 본사 관리자와 창고 관리자만 볼 수 있습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>입고 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Label htmlFor="inbound-keyword">입고·발주서 번호</Label>
              <Input
                id="inbound-keyword"
                placeholder="IB-20261005-0001"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="inbound-warehouse">창고</Label>
              <Select
                id="inbound-warehouse"
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
              <Label htmlFor="inbound-status">상태</Label>
              <Select
                id="inbound-status"
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
            <div>
              <Label htmlFor="inbound-from">도착일 (시작)</Label>
              <Input
                id="inbound-from"
                type="date"
                value={arrivedFrom}
                onChange={(e) => setArrivedFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="inbound-to">도착일 (끝)</Label>
              <Input
                id="inbound-to"
                type="date"
                value={arrivedTo}
                onChange={(e) => setArrivedTo(e.target.value)}
              />
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
            <InboundTable
              inbounds={inbounds}
              sort={pageInfo?.sort}
              onSort={paging.toggleSort}
            />
          )}
          {pageInfo && pageInfo.totalElements > 0 && (
            <Pager
              pageInfo={pageInfo}
              onPage={paging.setPage}
              onSize={paging.setSize}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InboundTable({
  inbounds,
  sort,
  onSort,
}: {
  inbounds: InboundListItem[]
  sort?: string
  onSort: (field: string) => void
}) {
  if (inbounds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 입고가 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead field="inboundNo" sort={sort} onSort={onSort}>
            입고 번호
          </SortableHead>
          <TableHead>발주서 번호</TableHead>
          <SortableHead field="warehouseName" sort={sort} onSort={onSort}>
            창고
          </SortableHead>
          <TableHead>공급처</TableHead>
          <SortableHead field="status" sort={sort} onSort={onSort}>
            상태
          </SortableHead>
          <SortableHead
            field="lineCount"
            sort={sort}
            onSort={onSort}
            className="text-right"
          >
            검수 항목
          </SortableHead>
          <SortableHead field="arrivedAt" sort={sort} onSort={onSort}>
            도착일시
          </SortableHead>
          <SortableHead field="receivedAt" sort={sort} onSort={onSort}>
            입고일시
          </SortableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inbounds.map((inbound) => (
          <LinkRow
            key={inbound.inboundId}
            to={`/inbounds/${inbound.inboundId}`}
          >
            <TableCell className="font-mono text-xs">
              {inbound.inboundNo}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {inbound.supplierOrderNo}
            </TableCell>
            <TableCell>{inbound.warehouseName}</TableCell>
            <TableCell>{inbound.supplierName}</TableCell>
            <TableCell>
              <StatusBadge status={inbound.status} />
            </TableCell>
            <TableCell className="text-right">{inbound.lineCount}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(inbound.arrivedAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(inbound.receivedAt)}
            </TableCell>
          </LinkRow>
        ))}
      </TableBody>
    </Table>
  )
}

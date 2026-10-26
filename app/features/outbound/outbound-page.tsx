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
import { formatDateTime } from "~/features/purchase-order/format"
import { useSelectableWarehouses } from "~/features/purchase-order/hooks"
import { useInitialParam } from "~/lib/use-initial-param"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { OutboundListItem, OutboundStatus } from "~/lib/api/outbound"
import { useCurrentUser } from "~/lib/current-user"

import { useOutbounds } from "./hooks"

const STATUS_OPTIONS: { value: OutboundStatus; label: string }[] = [
  { value: "READY", label: "출고 준비" },
  { value: "PICKING", label: "피킹 중" },
  { value: "PICKED", label: "피킹 완료" },
  { value: "SHIPPED", label: "배송 중" },
  { value: "DELIVERED", label: "배송 완료" },
  { value: "CANCELED", label: "취소됨" },
]

export function OutboundPage() {
  const { role } = useCurrentUser()
  const initialStatus = useInitialParam(
    "status",
    STATUS_OPTIONS.map((o) => o.value)
  )
  const [status, setStatus] = useState(initialStatus)
  const [warehouseId, setWarehouseId] = useState(useInitialParam("warehouseId"))
  const [keyword, setKeyword] = useState("")
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")

  const warehouses = useSelectableWarehouses()
  const filters = {
    status: (status || undefined) as OutboundStatus | undefined,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    keyword: keyword || undefined,
    // 양 끝 포함 조건이라 종료일은 그날 마지막 시각으로 보낸다.
    createdFrom: createdFrom ? `${createdFrom}T00:00:00` : undefined,
    createdTo: createdTo ? `${createdTo}T23:59:59` : undefined,
  }
  const paging = usePaging(JSON.stringify(filters))
  const query = useOutbounds({ ...filters, ...paging.params })
  const outbounds = query.data?.items ?? []
  const pageInfo = query.data?.pageInfo

  if (role === "STORE_OWNER") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        출고는 본사 관리자와 창고 관리자만 볼 수 있습니다. 진행 상황은 지점
        발주에서 확인하세요.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>출고 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Label htmlFor="ob-keyword">출고·발주 번호</Label>
              <Input
                id="ob-keyword"
                placeholder="OB-20261005-0001"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="ob-warehouse">창고</Label>
              <Select
                id="ob-warehouse"
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
              <Label htmlFor="ob-status">상태</Label>
              <Select
                id="ob-status"
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
              <Label htmlFor="ob-from">생성일 (시작)</Label>
              <Input
                id="ob-from"
                type="date"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ob-to">생성일 (끝)</Label>
              <Input
                id="ob-to"
                type="date"
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
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
            <OutboundTable
              outbounds={outbounds}
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

function OutboundTable({
  outbounds,
  sort,
  onSort,
}: {
  outbounds: OutboundListItem[]
  sort?: string
  onSort: (field: string) => void
}) {
  if (outbounds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 출고가 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead field="outboundNo" sort={sort} onSort={onSort}>
            출고 번호
          </SortableHead>
          <TableHead>발주 번호</TableHead>
          <SortableHead field="storeName" sort={sort} onSort={onSort}>
            지점
          </SortableHead>
          <SortableHead field="warehouseName" sort={sort} onSort={onSort}>
            창고
          </SortableHead>
          <SortableHead field="status" sort={sort} onSort={onSort}>
            상태
          </SortableHead>
          <SortableHead
            field="lineCount"
            sort={sort}
            onSort={onSort}
            className="text-right"
          >
            항목 수
          </SortableHead>
          <SortableHead field="shippedAt" sort={sort} onSort={onSort}>
            배송 시작
          </SortableHead>
          <SortableHead field="createdAt" sort={sort} onSort={onSort}>
            생성일시
          </SortableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {outbounds.map((o) => (
          <LinkRow key={o.outboundId} to={`/outbounds/${o.outboundId}`}>
            <TableCell className="font-mono text-xs">{o.outboundNo}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {o.orderNo}
            </TableCell>
            <TableCell>{o.storeName}</TableCell>
            <TableCell>{o.warehouseName}</TableCell>
            <TableCell>
              <StatusBadge status={o.status} />
            </TableCell>
            <TableCell className="text-right">{o.lineCount}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(o.shippedAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(o.createdAt)}
            </TableCell>
          </LinkRow>
        ))}
      </TableBody>
    </Table>
  )
}

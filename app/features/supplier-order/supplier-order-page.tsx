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
import { formatDateTime, formatWon } from "~/features/purchase-order/format"
import { useSelectableWarehouses } from "~/features/purchase-order/hooks"
import { useSuppliers } from "~/features/supplier/hooks"
import { getErrorMessage } from "~/lib/api/error-messages"
import type {
  SupplierOrderListItem,
  SupplierOrderStatus,
} from "~/lib/api/supplier-order"

import { useSupplierOrders } from "./hooks"

const STATUS_OPTIONS: { value: SupplierOrderStatus; label: string }[] = [
  { value: "ISSUED", label: "발행" },
  { value: "PARTIALLY_RECEIVED", label: "일부 입고" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELED", label: "취소됨" },
]

/**
 * 공급처 발주서 목록(조회 전용). 발주서는 본사가 창고 발주 요청을 확정할 때 공급처별로 생긴다.
 * 본사 관리자는 전체, 창고 관리자는 담당 창고만 서버가 좁힌다.
 */
export function SupplierOrderPage() {
  const [keyword, setKeyword] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [status, setStatus] = useState("")
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")

  const warehouses = useSelectableWarehouses()
  const suppliers = useSuppliers().data?.items ?? []
  const filters = {
    status: (status || undefined) as SupplierOrderStatus | undefined,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    supplierId: supplierId ? Number(supplierId) : undefined,
    keyword: keyword || undefined,
    // 양 끝 포함 조건이라 종료일은 그날 마지막 시각으로 보낸다.
    createdFrom: createdFrom ? `${createdFrom}T00:00:00` : undefined,
    createdTo: createdTo ? `${createdTo}T23:59:59` : undefined,
  }
  const paging = usePaging(JSON.stringify(filters))
  const query = useSupplierOrders({ ...filters, ...paging.params })
  const orders = query.data?.items ?? []
  const pageInfo = query.data?.pageInfo

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>공급처 발주서 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Label htmlFor="sup-keyword">발주서·요청 번호</Label>
              <Input
                id="sup-keyword"
                placeholder="SO-20261005-0001"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="sup-warehouse">창고</Label>
              <Select
                id="sup-warehouse"
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
            <div className="w-40">
              <Label htmlFor="sup-supplier">공급처</Label>
              <Select
                id="sup-supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">전체</option>
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.supplierName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-32">
              <Label htmlFor="sup-status">상태</Label>
              <Select
                id="sup-status"
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
              <Label htmlFor="sup-from">등록일 (시작)</Label>
              <Input
                id="sup-from"
                type="date"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sup-to">등록일 (끝)</Label>
              <Input
                id="sup-to"
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
            <SupplierOrderTable
              orders={orders}
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

function SupplierOrderTable({
  orders,
  sort,
  onSort,
}: {
  orders: SupplierOrderListItem[]
  sort?: string
  onSort: (field: string) => void
}) {
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 공급처 발주서가 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead field="supplierOrderNo" sort={sort} onSort={onSort}>
            발주서 번호
          </SortableHead>
          <TableHead>요청 번호</TableHead>
          <SortableHead field="warehouseName" sort={sort} onSort={onSort}>
            창고
          </SortableHead>
          <SortableHead field="supplierName" sort={sort} onSort={onSort}>
            공급처
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
          <SortableHead
            field="totalAmount"
            sort={sort}
            onSort={onSort}
            className="text-right"
          >
            총액
          </SortableHead>
          <SortableHead field="createdAt" sort={sort} onSort={onSort}>
            등록일시
          </SortableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <LinkRow
            key={order.supplierOrderId}
            to={`/supplier-orders/${order.supplierOrderId}`}
          >
            <TableCell className="font-mono text-xs">
              {order.supplierOrderNo}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {order.purchaseOrderNo}
            </TableCell>
            <TableCell>{order.warehouseName}</TableCell>
            <TableCell>{order.supplierName}</TableCell>
            <TableCell>
              <StatusBadge status={order.status} />
            </TableCell>
            <TableCell className="text-right">{order.lineCount}</TableCell>
            <TableCell className="text-right">
              {formatWon(order.totalAmount)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </TableCell>
          </LinkRow>
        ))}
      </TableBody>
    </Table>
  )
}

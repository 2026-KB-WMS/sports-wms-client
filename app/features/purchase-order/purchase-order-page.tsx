import { useState } from "react"
import { Plus } from "lucide-react"
import { Link } from "react-router"

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
import { getErrorMessage } from "~/lib/api/error-messages"
import type {
  PurchaseOrderListItem,
  PurchaseOrderStatus,
} from "~/lib/api/purchase-order"
import { useCurrentUser } from "~/lib/current-user"
import { useSuppliers } from "~/features/supplier/hooks"

import { formatDateTime, formatWon } from "./format"
import { usePurchaseOrders, useSelectableWarehouses } from "./hooks"
import { PurchaseOrderCreateForm } from "./purchase-order-create-form"

const STATUS_OPTIONS: { value: PurchaseOrderStatus; label: string }[] = [
  { value: "REQUESTED", label: "확정 대기" },
  { value: "CONFIRMED", label: "확정" },
  { value: "COMPLETED", label: "입고 완료" },
  { value: "CANCELED", label: "취소" },
]

export function PurchaseOrderPage() {
  const { role } = useCurrentUser()
  const [status, setStatus] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [keyword, setKeyword] = useState("")
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")
  const [showForm, setShowForm] = useState(false)

  const warehouses = useSelectableWarehouses()
  const suppliers = useSuppliers().data?.items ?? []

  const query = usePurchaseOrders({
    status: (status || undefined) as PurchaseOrderStatus | undefined,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    supplierId: supplierId ? Number(supplierId) : undefined,
    keyword: keyword || undefined,
    // 양 끝 포함 조건이라 종료일은 그날 마지막 시각으로 보낸다.
    createdFrom: createdFrom ? `${createdFrom}T00:00:00` : undefined,
    createdTo: createdTo ? `${createdTo}T23:59:59` : undefined,
  })
  const orders = query.data?.items ?? []

  if (role === "STORE_OWNER") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        창고 발주는 본사 관리자와 창고 관리자만 볼 수 있습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {role === "WAREHOUSE_MANAGER" && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus data-icon="inline-start" />
            발주 등록
          </Button>
        </div>
      )}

      {showForm && (
        <PurchaseOrderCreateForm onClose={() => setShowForm(false)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>창고 발주 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-40">
              <Label htmlFor="po-keyword">발주 번호</Label>
              <Input
                id="po-keyword"
                placeholder="PO-20261005-0001"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="po-status">상태</Label>
              <Select
                id="po-status"
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
            <div className="w-40">
              <Label htmlFor="po-warehouse">창고</Label>
              <Select
                id="po-warehouse"
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
              <Label htmlFor="po-supplier">공급처</Label>
              <Select
                id="po-supplier"
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
            <div>
              <Label htmlFor="po-from">등록일 (시작)</Label>
              <Input
                id="po-from"
                type="date"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="po-to">등록일 (끝)</Label>
              <Input
                id="po-to"
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
            <PurchaseOrderTable orders={orders} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PurchaseOrderTable({ orders }: { orders: PurchaseOrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 발주가 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>발주 번호</TableHead>
          <TableHead>창고</TableHead>
          <TableHead>공급처</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">항목 수</TableHead>
          <TableHead className="text-right">총액</TableHead>
          <TableHead>입고 예정</TableHead>
          <TableHead>등록일시</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.purchaseOrderId}>
            <TableCell className="font-mono text-xs">
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
              {formatDateTime(order.expectedAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link to={`/purchase-orders/${order.purchaseOrderId}`} />
                }
              >
                상세
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

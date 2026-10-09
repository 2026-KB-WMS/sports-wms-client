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
import { formatDateTime, formatWon } from "~/features/purchase-order/format"
import { useSelectableWarehouses } from "~/features/purchase-order/hooks"
import { useMyStores, useStores } from "~/features/store/hooks"
import { getErrorMessage } from "~/lib/api/error-messages"
import type {
  StoreOrderListItem,
  StoreOrderStatus,
} from "~/lib/api/store-order"
import { useCurrentUser } from "~/lib/current-user"

import { useStoreOrders } from "./hooks"
import { StoreOrderCreateForm } from "./store-order-create-form"

const STATUS_OPTIONS: { value: StoreOrderStatus; label: string }[] = [
  { value: "REQUESTED", label: "승인 대기" },
  { value: "APPROVED", label: "승인" },
  { value: "ASSIGNED", label: "창고 배정" },
  { value: "ON_HOLD", label: "보류" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELED", label: "취소됨" },
  { value: "REJECTED", label: "반려됨" },
]

/**
 * 지점 발주 목록.
 * `GET /orders/my`가 서버에 없어서(인증 연동 때 구현) 역할별로 `GET /orders`를 좁혀 쓴다.
 * 점주는 본인 지점(storeId), 창고 관리자는 담당 창고(warehouseId)로 조회한다.
 */
export function StoreOrderPage() {
  const { role } = useCurrentUser()
  const isAdmin = role === "HQ_ADMIN"
  const isOwner = role === "STORE_OWNER"
  const isManager = role === "WAREHOUSE_MANAGER"

  const [status, setStatus] = useState("")
  const [storeId, setStoreId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [keyword, setKeyword] = useState("")
  const [requestedFrom, setRequestedFrom] = useState("")
  const [requestedTo, setRequestedTo] = useState("")
  const [showForm, setShowForm] = useState(false)

  const myStores = useMyStores(isOwner).data?.items ?? []
  const allStores = useStores({ isActive: true }, isAdmin).data?.items ?? []
  const storeOptions = isOwner ? myStores : allStores
  const warehouses = useSelectableWarehouses()

  // 점주·창고 관리자는 본인 범위가 정해져야 조회한다. 고르지 않으면 첫 항목을 쓴다.
  const scopedStoreId = isOwner
    ? storeId || String(myStores[0]?.storeId ?? "")
    : storeId
  const scopedWarehouseId = isManager
    ? warehouseId || String(warehouses[0]?.warehouseId ?? "")
    : warehouseId
  const scopeReady =
    isAdmin ||
    (isOwner && scopedStoreId !== "") ||
    (isManager && scopedWarehouseId !== "")

  const query = useStoreOrders(
    {
      status: (status || undefined) as StoreOrderStatus | undefined,
      storeId: scopedStoreId ? Number(scopedStoreId) : undefined,
      warehouseId: scopedWarehouseId ? Number(scopedWarehouseId) : undefined,
      keyword: keyword || undefined,
      // 양 끝 포함 조건이라 종료일은 그날 마지막 시각으로 보낸다.
      requestedFrom: requestedFrom ? `${requestedFrom}T00:00:00` : undefined,
      requestedTo: requestedTo ? `${requestedTo}T23:59:59` : undefined,
    },
    scopeReady
  )
  const orders = query.data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus data-icon="inline-start" />
            발주 등록
          </Button>
        </div>
      )}

      {isOwner && showForm && (
        <StoreOrderCreateForm
          stores={myStores}
          onClose={() => setShowForm(false)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>지점 발주 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-40">
              <Label htmlFor="so-keyword">주문 번호·지점명</Label>
              <Input
                id="so-keyword"
                placeholder="SO-20261005-0001"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="so-status">상태</Label>
              <Select
                id="so-status"
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
            {(isAdmin || (isOwner && myStores.length > 1)) && (
              <div className="w-40">
                <Label htmlFor="so-store">지점</Label>
                <Select
                  id="so-store"
                  value={isOwner ? scopedStoreId : storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                >
                  {isAdmin && <option value="">전체</option>}
                  {storeOptions.map((s) => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.storeName}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {(isAdmin || (isManager && warehouses.length > 1)) && (
              <div className="w-40">
                <Label htmlFor="so-warehouse">창고</Label>
                <Select
                  id="so-warehouse"
                  value={isManager ? scopedWarehouseId : warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  {isAdmin && <option value="">전체</option>}
                  {warehouses.map((w) => (
                    <option key={w.warehouseId} value={w.warehouseId}>
                      {w.warehouseName}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="so-from">요청일 (시작)</Label>
              <Input
                id="so-from"
                type="date"
                value={requestedFrom}
                onChange={(e) => setRequestedFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="so-to">요청일 (끝)</Label>
              <Input
                id="so-to"
                type="date"
                value={requestedTo}
                onChange={(e) => setRequestedTo(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!scopeReady && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isOwner ? "배정된 지점이 없습니다." : "배정된 창고가 없습니다."}
            </p>
          )}
          {scopeReady && query.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {scopeReady && query.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(query.error, "목록을 불러오지 못했습니다.")}
            </p>
          )}
          {scopeReady && !query.isLoading && !query.isError && (
            <StoreOrderTable orders={orders} showProgress={isOwner} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StoreOrderTable({
  orders,
  showProgress,
}: {
  orders: StoreOrderListItem[]
  showProgress: boolean
}) {
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
          <TableHead>주문 번호</TableHead>
          <TableHead>지점</TableHead>
          <TableHead>배정 창고</TableHead>
          <TableHead>{showProgress ? "진행 상황" : "상태"}</TableHead>
          <TableHead className="text-right">항목 수</TableHead>
          <TableHead className="text-right">총액</TableHead>
          <TableHead>배송 요청</TableHead>
          <TableHead>요청일시</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.storeOrderId}>
            <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
            <TableCell>{order.storeName}</TableCell>
            <TableCell className="text-muted-foreground">
              {order.warehouseName ?? "-"}
            </TableCell>
            <TableCell>
              {showProgress ? (
                <StatusBadge status={order.progressStage} kind="progress" />
              ) : (
                <StatusBadge status={order.status} />
              )}
            </TableCell>
            <TableCell className="text-right">{order.lineCount}</TableCell>
            <TableCell className="text-right">
              {formatWon(order.totalAmount)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(order.requestedDeliveryAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(order.requestedAt)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                render={<Link to={`/store-orders/${order.storeOrderId}`} />}
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

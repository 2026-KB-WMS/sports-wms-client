import { useState } from "react"

import { LinkRow } from "~/components/common/link-row"
import { ReasonDialog } from "~/components/common/reason-dialog"
import { StatusBadge } from "~/components/common/status-badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { PurchaseOrder, PurchaseOrderLine } from "~/lib/api/purchase-order"
import { useCurrentUser } from "~/lib/current-user"

import { formatDateTime, formatWon } from "./format"
import {
  useCancelPurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrderLines,
  useRejectPurchaseOrder,
} from "./hooks"
import { PurchaseOrderConfirmDialog } from "./purchase-order-confirm-dialog"

export function PurchaseOrderDetailPage({
  purchaseOrderId,
}: {
  purchaseOrderId: number
}) {
  const orderQuery = usePurchaseOrder(purchaseOrderId)
  const linesQuery = usePurchaseOrderLines(purchaseOrderId)
  const order = orderQuery.data
  const lines = linesQuery.data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {orderQuery.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {orderQuery.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(orderQuery.error, "발주를 불러오지 못했습니다.")}
        </p>
      )}
      {order && <OrderHeaderCard order={order} lines={lines} />}
      {order && order.supplierOrders.length > 0 && (
        <SupplierOrdersCard order={order} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>발주 항목</CardTitle>
        </CardHeader>
        <CardContent>
          {linesQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {linesQuery.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(linesQuery.error, "항목을 불러오지 못했습니다.")}
            </p>
          )}
          {!linesQuery.isLoading && !linesQuery.isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>공급처</TableHead>
                  <TableHead className="text-right">발주 수량</TableHead>
                  <TableHead className="text-right">입고 수량</TableHead>
                  <TableHead className="text-right">잔여</TableHead>
                  <TableHead className="text-right">단가</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.purchaseOrderLineId}>
                    <TableCell>
                      <span className="block font-mono text-xs font-normal text-muted-foreground">
                        {line.skuCode}
                      </span>
                      {line.skuName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {line.supplierName ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.expectedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.receivedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.remainingQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatWon(line.orderedUnitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatWon(line.lineAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={line.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OrderHeaderCard({
  order,
  lines,
}: {
  order: PurchaseOrder
  lines: PurchaseOrderLine[]
}) {
  const { userId, role } = useCurrentUser()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const reject = useRejectPurchaseOrder()
  const cancel = useCancelPurchaseOrder()

  // 확정·반려는 본사 관리자만, REQUESTED에서만 한다. 취소는 REQUESTED면 작성자(창고 관리자), CONFIRMED면 본사 관리자만 가능하다.
  const canConfirm = role === "HQ_ADMIN" && order.status === "REQUESTED"
  const canReject = canConfirm
  const canCancel =
    (order.status === "REQUESTED" &&
      role === "WAREHOUSE_MANAGER" &&
      order.createdBy === userId) ||
    (order.status === "CONFIRMED" && role === "HQ_ADMIN")
  const reasonRequired = order.status === "CONFIRMED"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-mono">{order.purchaseOrderNo}</CardTitle>
        <div className="flex gap-2">
          {canConfirm && (
            <Button size="sm" onClick={() => setConfirmOpen(true)}>
              발주 확정
            </Button>
          )}
          {canReject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                reject.reset()
                setRejectOpen(true)
              }}
            >
              반려
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                cancel.reset()
                setCancelOpen(true)
              }}
            >
              발주 취소
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted-foreground">상태 </span>
          <StatusBadge status={order.status} />
        </p>
        <p>
          <span className="text-muted-foreground">총액 </span>
          {formatWon(order.totalAmount)}
        </p>
        <p>
          <span className="text-muted-foreground">입고 창고 </span>
          {order.warehouseName}
        </p>
        <p>
          <span className="text-muted-foreground">공급처 </span>
          {order.supplierOrders.length > 0
            ? order.supplierOrders.map((s) => s.supplierName).join(", ")
            : "미정 (본사 확정 시 지정)"}
        </p>
        <p>
          <span className="text-muted-foreground">입고 예정 </span>
          {formatDateTime(order.expectedAt)}
        </p>
        <p>
          <span className="text-muted-foreground">등록 </span>
          {formatDateTime(order.createdAt)} (
          {order.createdByName ?? `사용자 #${order.createdBy}`})
        </p>
        {order.note && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">비고 </span>
            {order.note}
          </p>
        )}
        {order.rejectReason && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">반려 사유 </span>
            {order.rejectReason}
          </p>
        )}
        {order.cancelReason && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">취소 사유 </span>
            {order.cancelReason}
          </p>
        )}
      </CardContent>

      <PurchaseOrderConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        purchaseOrderId={order.purchaseOrderId}
        lines={lines}
      />

      <ReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="발주 반려"
        description="반려하면 확정·취소·입고를 할 수 없습니다. 창고 관리자가 확인할 수 있도록 사유를 입력해 주세요."
        required
        submitLabel="반려"
        destructive
        isPending={reject.isPending}
        error={
          reject.isError
            ? getErrorMessage(reject.error, "반려에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          reject.mutate(
            { purchaseOrderId: order.purchaseOrderId, reason },
            { onSuccess: () => setRejectOpen(false) }
          )
        }
      />

      <ReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="발주 취소"
        description={
          reasonRequired
            ? "확정된 발주를 취소하려면 사유를 입력해야 합니다. 공급처 발주서도 함께 취소되며, 취소되지 않은 입고가 있으면 취소할 수 없습니다."
            : "확정 전 발주를 취소합니다."
        }
        required={reasonRequired}
        submitLabel="발주 취소"
        destructive
        isPending={cancel.isPending}
        error={
          cancel.isError
            ? getErrorMessage(cancel.error, "취소에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          cancel.mutate(
            {
              purchaseOrderId: order.purchaseOrderId,
              reason: reason || undefined,
            },
            { onSuccess: () => setCancelOpen(false) }
          )
        }
      />
    </Card>
  )
}

/** 확정으로 생긴 공급처 발주서. 입고는 발주서 단위로 등록한다. */
function SupplierOrdersCard({ order }: { order: PurchaseOrder }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>공급처 발주서</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>발주서 번호</TableHead>
              <TableHead>공급처</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">항목 수</TableHead>
              <TableHead className="text-right">금액</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.supplierOrders.map((so) => (
              <LinkRow
                key={so.supplierOrderId}
                to={`/supplier-orders/${so.supplierOrderId}`}
              >
                <TableCell className="font-mono text-xs">
                  {so.supplierOrderNo}
                </TableCell>
                <TableCell>{so.supplierName}</TableCell>
                <TableCell>
                  <StatusBadge status={so.status} />
                </TableCell>
                <TableCell className="text-right">{so.lineCount}</TableCell>
                <TableCell className="text-right">
                  {formatWon(so.totalAmount)}
                </TableCell>
              </LinkRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

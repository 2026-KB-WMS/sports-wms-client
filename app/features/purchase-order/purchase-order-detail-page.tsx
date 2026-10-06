import { useState } from "react"

import { ConfirmDialog } from "~/components/common/confirm-dialog"
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
import type { PurchaseOrder } from "~/lib/api/purchase-order"
import { useCurrentUser } from "~/lib/current-user"

import { formatDateTime, formatWon } from "./format"
import {
  useCancelPurchaseOrder,
  useConfirmPurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrderLines,
} from "./hooks"

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
      {order && <OrderHeaderCard order={order} />}

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
                  <TableHead>SKU 코드</TableHead>
                  <TableHead>SKU명</TableHead>
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
                    <TableCell className="font-mono text-xs">
                      {line.skuCode}
                    </TableCell>
                    <TableCell>{line.skuName}</TableCell>
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

function OrderHeaderCard({ order }: { order: PurchaseOrder }) {
  const { userId, role } = useCurrentUser()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const confirm = useConfirmPurchaseOrder()
  const cancel = useCancelPurchaseOrder()

  // 확정은 본사 관리자만. 취소는 REQUESTED면 작성자(창고 관리자), CONFIRMED면 본사 관리자만 가능하다.
  const canConfirm = role === "HQ_ADMIN" && order.status === "REQUESTED"
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
            <Button
              size="sm"
              onClick={() => {
                confirm.reset()
                setConfirmOpen(true)
              }}
            >
              발주 확정
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
          {order.supplierName}
        </p>
        <p>
          <span className="text-muted-foreground">입고 예정 </span>
          {formatDateTime(order.expectedAt)}
        </p>
        <p>
          <span className="text-muted-foreground">등록 </span>
          {formatDateTime(order.createdAt)} (사용자 #{order.createdBy}
          {order.createdByName ? ` ${order.createdByName}` : ""})
        </p>
        {order.note && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">비고 </span>
            {order.note}
          </p>
        )}
        {order.cancelReason && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">취소 사유 </span>
            {order.cancelReason}
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="발주 확정"
        description="확정하면 공급처·품목·수량을 수정할 수 없고, 변경이 필요하면 취소 후 다시 등록해야 합니다. 확정된 발주에 대해서만 입고를 등록할 수 있습니다."
        confirmLabel="확정"
        isPending={confirm.isPending}
        error={
          confirm.isError
            ? getErrorMessage(confirm.error, "확정에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          confirm.mutate(order.purchaseOrderId, {
            onSuccess: () => setConfirmOpen(false),
          })
        }
      />

      <ReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="발주 취소"
        description={
          reasonRequired
            ? "확정된 발주를 취소하려면 사유를 입력해야 합니다. 취소되지 않은 입고가 있으면 취소할 수 없습니다."
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

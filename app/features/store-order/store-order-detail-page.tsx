import { useState } from "react"
import { Link } from "react-router"

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
import { formatDateTime, formatWon } from "~/features/purchase-order/format"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { StoreOrder, StoreOrderLine } from "~/lib/api/store-order"
import { AllocateDialog } from "~/features/outbound/allocate-dialog"
import { OutboundCreateDialog } from "~/features/outbound/outbound-create-dialog"
import { useCurrentUser } from "~/lib/current-user"

import {
  useApproveStoreOrder,
  useCancelStoreOrder,
  useCompletePartialStoreOrder,
  useHoldStoreOrder,
  useRejectStoreOrder,
  useResumeStoreOrder,
  useStoreOrder,
  useStoreOrderDetails,
} from "./hooks"
import { StoreOrderAssignDialog } from "./store-order-assign-dialog"

export function StoreOrderDetailPage({
  storeOrderId,
}: {
  storeOrderId: number
}) {
  const orderQuery = useStoreOrder(storeOrderId)
  const detailsQuery = useStoreOrderDetails(storeOrderId)
  const order = orderQuery.data
  const details = detailsQuery.data
  // 출고·재고 할당 화면은 점주가 볼 수 없다.
  const canViewFulfillment = useCurrentUser().role !== "STORE_OWNER"

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
      {order && <OrderHeaderCard order={order} lines={details?.items ?? []} />}

      {detailsQuery.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(detailsQuery.error, "상세를 불러오지 못했습니다.")}
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>발주 항목</CardTitle>
          {canViewFulfillment && (
            <Button
              variant="ghost"
              size="sm"
              render={<Link to={`/allocations?storeOrderId=${storeOrderId}`} />}
            >
              재고 할당 보기
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {detailsQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {details && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU 코드</TableHead>
                  <TableHead>SKU명</TableHead>
                  <TableHead className="text-right">요청</TableHead>
                  <TableHead className="text-right">할당</TableHead>
                  <TableHead className="text-right">출고</TableHead>
                  <TableHead className="text-right">잔여</TableHead>
                  <TableHead className="text-right">공급가</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.items.map((item) => (
                  <TableRow key={item.storeOrderLineId}>
                    <TableCell className="font-mono text-xs">
                      {item.skuCode}
                    </TableCell>
                    <TableCell>{item.skuName}</TableCell>
                    <TableCell className="text-right">
                      {item.requestedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.allocatedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.shippedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.remainingQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatWon(item.requestedUnitSupplyPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatWon(item.lineAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {details && details.outbounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>출고</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>출고 번호</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>출고일시</TableHead>
                  <TableHead>배송 완료</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.outbounds.map((outbound) => (
                  <TableRow key={outbound.outboundId}>
                    <TableCell className="font-mono text-xs">
                      {outbound.outboundNo}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={outbound.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(outbound.shippedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(outbound.deliveredAt)}
                    </TableCell>
                    <TableCell>
                      {canViewFulfillment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <Link to={`/outbounds/${outbound.outboundId}`} />
                          }
                        >
                          상세
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {details && (
        <Card>
          <CardHeader>
            <CardTitle>상태 이력</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>변경</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>처리자</TableHead>
                  <TableHead>일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.statusHistory.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        {h.fromStatus ? (
                          <StatusBadge status={h.fromStatus} />
                        ) : (
                          <span className="text-muted-foreground">등록</span>
                        )}
                        →
                        <StatusBadge status={h.toStatus} />
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {h.reason ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {h.changedByName ?? `#${h.changedBy}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(h.changedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

type Action =
  | "approve"
  | "reject"
  | "assign"
  | "cancel"
  | "hold"
  | "resume"
  | "partial"
  | "allocate"
  | "outbound"

function OrderHeaderCard({
  order,
  lines,
}: {
  order: StoreOrder
  lines: StoreOrderLine[]
}) {
  const { userId, role } = useCurrentUser()
  const [action, setAction] = useState<Action | null>(null)
  const approve = useApproveStoreOrder()
  const reject = useRejectStoreOrder()
  const cancel = useCancelStoreOrder()
  const hold = useHoldStoreOrder()
  const resume = useResumeStoreOrder()
  const partial = useCompletePartialStoreOrder()

  const isAdmin = role === "HQ_ADMIN"
  const isManager = role === "WAREHOUSE_MANAGER"
  const isCreator = role === "STORE_OWNER" && order.createdBy === userId

  // 서버 권한 검사가 아직 없어서 화면이 역할·상태로 버튼을 제한한다. (명세의 권한 표 기준)
  const canApprove = isAdmin && order.status === "REQUESTED"
  const canAssign =
    isAdmin && (order.status === "APPROVED" || order.status === "ASSIGNED")
  const canCancel =
    (order.status === "REQUESTED" && isCreator) ||
    (isAdmin &&
      (order.status === "APPROVED" ||
        order.status === "ASSIGNED" ||
        order.status === "ON_HOLD"))
  const canHold = isManager && order.status === "ASSIGNED"
  const canResume = isManager && order.status === "ON_HOLD"
  const canPartial = isManager && order.status === "ASSIGNED"
  // 재고 할당·출고 생성은 배정된(ASSIGNED) 발주에서만 가능하다. 보류 중에는 막힌다.
  const canFulfill = isManager && order.status === "ASSIGNED"

  function open(next: Action, reset: () => void) {
    reset()
    setAction(next)
  }
  const close = (value: boolean) => !value && setAction(null)
  const id = order.storeOrderId

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="font-mono">{order.orderNo}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <>
              <Button size="sm" onClick={() => open("approve", approve.reset)}>
                승인
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => open("reject", reject.reset)}
              >
                반려
              </Button>
            </>
          )}
          {canAssign && (
            <Button
              variant={order.status === "APPROVED" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("assign")}
            >
              {order.status === "APPROVED" ? "창고 배정" : "창고 변경"}
            </Button>
          )}
          {canFulfill && (
            <>
              <Button size="sm" onClick={() => setAction("allocate")}>
                재고 할당
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAction("outbound")}
              >
                출고 생성
              </Button>
            </>
          )}
          {canHold && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => open("hold", hold.reset)}
            >
              출고 보류
            </Button>
          )}
          {canResume && (
            <Button size="sm" onClick={() => open("resume", resume.reset)}>
              출고 재개
            </Button>
          )}
          {canPartial && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => open("partial", partial.reset)}
            >
              부분 출고 종결
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => open("cancel", cancel.reset)}
            >
              발주 취소
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted-foreground">상태 </span>
          <StatusBadge status={order.status} />{" "}
          <StatusBadge status={order.progressStage} kind="progress" />
        </p>
        <p>
          <span className="text-muted-foreground">총액 </span>
          {formatWon(order.totalAmount)}
        </p>
        <p>
          <span className="text-muted-foreground">지점 </span>
          {order.storeName}
        </p>
        <p>
          <span className="text-muted-foreground">배정 창고 </span>
          {order.warehouseName ?? "미배정"}
        </p>
        <p>
          <span className="text-muted-foreground">배송 요청 </span>
          {formatDateTime(order.requestedDeliveryAt)}
        </p>
        <p>
          <span className="text-muted-foreground">요청 </span>
          {formatDateTime(order.requestedAt)} ({order.createdByName ?? `사용자 #${order.createdBy}`})
        </p>
        {order.note && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">비고 </span>
            {order.note}
          </p>
        )}
        {order.statusReason && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">
              {order.status === "REJECTED"
                ? "반려 사유 "
                : order.status === "CANCELED"
                  ? "취소 사유 "
                  : "보류 사유 "}
            </span>
            {order.statusReason}
          </p>
        )}
      </CardContent>

      <AllocateDialog
        open={action === "allocate"}
        onOpenChange={close}
        storeOrderId={id}
        lines={lines}
      />

      <OutboundCreateDialog
        open={action === "outbound"}
        onOpenChange={close}
        storeOrderId={id}
      />

      <ConfirmDialog
        open={action === "approve"}
        onOpenChange={close}
        title="발주 승인"
        description="승인하면 수량·품목을 수정할 수 없고, 변경이 필요하면 취소 후 다시 등록해야 합니다. 승인 뒤에는 창고를 배정합니다."
        confirmLabel="승인"
        isPending={approve.isPending}
        error={
          approve.isError
            ? getErrorMessage(approve.error, "승인에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          approve.mutate(id, { onSuccess: () => setAction(null) })
        }
      />

      <ReasonDialog
        open={action === "reject"}
        onOpenChange={close}
        title="발주 반려"
        description="반려된 발주는 수정하거나 다시 제출할 수 없고, 점주가 새 발주를 등록해야 합니다."
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
            { storeOrderId: id, reason },
            { onSuccess: () => setAction(null) }
          )
        }
      />

      <ReasonDialog
        open={action === "cancel"}
        onOpenChange={close}
        title="발주 취소"
        description={
          order.status === "REQUESTED"
            ? "승인 전 발주를 취소합니다."
            : "승인 이후 발주를 취소하려면 사유가 필요합니다. 재고 할당은 해제되고 출고 준비 중인 출고는 취소됩니다. 피킹이 시작된 출고가 있으면 취소할 수 없습니다."
        }
        required={order.status !== "REQUESTED"}
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
            { storeOrderId: id, reason: reason || undefined },
            { onSuccess: () => setAction(null) }
          )
        }
      />

      <ReasonDialog
        open={action === "hold"}
        onOpenChange={close}
        title="출고 보류"
        description="보류하는 동안에는 새 재고 할당·출고 생성·피킹을 할 수 없습니다. 이미 있는 할당과 출고는 유지됩니다. 피킹이 시작된 출고가 있으면 보류할 수 없습니다."
        submitLabel="보류"
        isPending={hold.isPending}
        error={
          hold.isError
            ? getErrorMessage(hold.error, "보류에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          hold.mutate(
            { storeOrderId: id, reason },
            { onSuccess: () => setAction(null) }
          )
        }
      />

      <ReasonDialog
        open={action === "resume"}
        onOpenChange={close}
        title="출고 재개"
        description="보류를 풀고 다시 재고 할당·출고를 진행합니다."
        submitLabel="재개"
        isPending={resume.isPending}
        error={
          resume.isError
            ? getErrorMessage(resume.error, "재개에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          resume.mutate(
            { storeOrderId: id, reason },
            { onSuccess: () => setAction(null) }
          )
        }
      />

      <ReasonDialog
        open={action === "partial"}
        onOpenChange={close}
        title="부분 출고 종결"
        description="남은 수량을 더 이상 출고하지 않고 발주를 종결합니다. 남은 재고 할당은 해제되고, 부족 수량은 지점이 필요하면 직접 재발주해야 합니다. 진행 중인 출고가 있거나 부족 수량이 없으면 종결할 수 없습니다."
        label="종결 사유"
        submitLabel="종결"
        destructive
        isPending={partial.isPending}
        error={
          partial.isError
            ? getErrorMessage(partial.error, "종결에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          partial.mutate(
            { storeOrderId: id, reason },
            { onSuccess: () => setAction(null) }
          )
        }
      />

      <StoreOrderAssignDialog
        open={action === "assign"}
        onOpenChange={close}
        storeOrderId={id}
        currentWarehouseId={order.warehouseId}
      />
    </Card>
  )
}

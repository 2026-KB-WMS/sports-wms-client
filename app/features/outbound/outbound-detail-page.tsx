import { useState } from "react"
import { Link } from "react-router"

import { ConfirmDialog } from "~/components/common/confirm-dialog"
import { ReasonDialog } from "~/components/common/reason-dialog"
import { StatusBadge } from "~/components/common/status-badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
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
import type { OutboundDetails, OutboundLine } from "~/lib/api/outbound"
import { useCurrentUser } from "~/lib/current-user"

import {
  useCancelOutbound,
  useCompletePicking,
  useDeliverOutbound,
  useOutboundDetails,
  useShipOutbound,
  useStartPicking,
} from "./hooks"

export function OutboundDetailPage({ outboundId }: { outboundId: number }) {
  const query = useOutboundDetails(outboundId)
  const outbound = query.data
  const [picking, setPicking] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {query.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {query.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "출고를 불러오지 못했습니다.")}
        </p>
      )}
      {outbound && (
        <OutboundHeaderCard
          outbound={outbound}
          picking={picking}
          onTogglePicking={() => setPicking((v) => !v)}
        />
      )}
      {outbound && (
        <Card>
          <CardHeader>
            <CardTitle>{picking ? "피킹 결과 입력" : "출고 항목"}</CardTitle>
          </CardHeader>
          <CardContent>
            {picking ? (
              <PickingForm
                outbound={outbound}
                onDone={() => setPicking(false)}
              />
            ) : (
              <LineTable items={outbound.items} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function OutboundHeaderCard({
  outbound,
  picking,
  onTogglePicking,
}: {
  outbound: OutboundDetails
  picking: boolean
  onTogglePicking: () => void
}) {
  const { role } = useCurrentUser()
  // 출고 처리는 창고 관리자만 한다(본사 관리자는 조회만).
  const isManager = role === "WAREHOUSE_MANAGER"
  const [dialog, setDialog] = useState<
    "start" | "ship" | "deliver" | "cancel" | null
  >(null)
  const start = useStartPicking()
  const ship = useShipOutbound()
  const deliver = useDeliverOutbound()
  const cancel = useCancelOutbound()
  const id = outbound.outboundId

  function open(next: typeof dialog, reset: () => void) {
    reset()
    setDialog(next)
  }
  const close = (value: boolean) => !value && setDialog(null)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="font-mono">{outbound.outboundNo}</CardTitle>
        {isManager && (
          <div className="flex flex-wrap gap-2">
            {outbound.status === "READY" && (
              <>
                <Button size="sm" onClick={() => open("start", start.reset)}>
                  피킹 시작
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => open("cancel", cancel.reset)}
                >
                  출고 취소
                </Button>
              </>
            )}
            {outbound.status === "PICKING" && (
              <Button size="sm" onClick={onTogglePicking}>
                {picking ? "피킹 입력 닫기" : "피킹 완료 입력"}
              </Button>
            )}
            {outbound.status === "PICKED" && (
              <Button size="sm" onClick={() => open("ship", ship.reset)}>
                배송 시작
              </Button>
            )}
            {outbound.status === "SHIPPED" && (
              <Button size="sm" onClick={() => open("deliver", deliver.reset)}>
                배송 완료
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted-foreground">상태 </span>
          <StatusBadge status={outbound.status} />
        </p>
        <p>
          <span className="text-muted-foreground">발주 </span>
          <Link
            className="underline underline-offset-2"
            to={`/store-orders/${outbound.storeOrderId}`}
          >
            {outbound.orderNo}
          </Link>
        </p>
        <p>
          <span className="text-muted-foreground">지점 </span>
          {outbound.storeName}
        </p>
        <p>
          <span className="text-muted-foreground">창고 </span>
          {outbound.warehouseName}
        </p>
        <p>
          <span className="text-muted-foreground">배송 시작 </span>
          {formatDateTime(outbound.shippedAt)}
          {outbound.shippedBy != null && ` (사용자 #${outbound.shippedBy})`}
        </p>
        <p>
          <span className="text-muted-foreground">배송 완료 </span>
          {formatDateTime(outbound.deliveredAt)}
        </p>
        {outbound.note && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">비고 </span>
            {outbound.note}
          </p>
        )}
        {outbound.cancelReason && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">취소 사유 </span>
            {outbound.cancelReason}
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={dialog === "start"}
        onOpenChange={close}
        title="피킹 시작"
        description="피킹을 시작하면 이 출고의 재고 할당을 해제하거나 출고를 취소할 수 없고, 본사도 발주를 취소할 수 없습니다."
        confirmLabel="피킹 시작"
        isPending={start.isPending}
        error={
          start.isError
            ? getErrorMessage(start.error, "피킹 시작에 실패했습니다.")
            : null
        }
        onConfirm={() => start.mutate(id, { onSuccess: () => setDialog(null) })}
      />

      <ConfirmDialog
        open={dialog === "ship"}
        onOpenChange={close}
        title="배송 시작"
        description="출고를 배송 중으로 바꿉니다. 재고는 피킹을 완료할 때 이미 차감되어 여기서는 바뀌지 않습니다."
        confirmLabel="배송 시작"
        isPending={ship.isPending}
        error={
          ship.isError
            ? getErrorMessage(ship.error, "배송 시작에 실패했습니다.")
            : null
        }
        onConfirm={() => ship.mutate(id, { onSuccess: () => setDialog(null) })}
      />

      <ConfirmDialog
        open={dialog === "deliver"}
        onOpenChange={close}
        title="배송 완료"
        description="모든 항목이 출고되고 진행 중인 다른 출고가 없으면 지점 발주가 자동으로 완료됩니다. 남은 수량이 있으면 발주는 유지되고 다시 할당해 후속 출고를 진행합니다."
        confirmLabel="배송 완료"
        isPending={deliver.isPending}
        error={
          deliver.isError
            ? getErrorMessage(deliver.error, "배송 완료 처리에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          deliver.mutate(id, { onSuccess: () => setDialog(null) })
        }
      />

      <ReasonDialog
        open={dialog === "cancel"}
        onOpenChange={close}
        title="출고 취소"
        description="출고 준비(READY) 상태에서만 취소할 수 있습니다. 재고 할당은 유지되어 다시 출고로 묶거나 해제할 수 있습니다."
        submitLabel="출고 취소"
        destructive
        isPending={cancel.isPending}
        error={
          cancel.isError
            ? getErrorMessage(cancel.error, "취소에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          cancel.mutate(
            { outboundId: id, reason },
            { onSuccess: () => setDialog(null) }
          )
        }
      />
    </Card>
  )
}

/**
 * 피킹 결과 입력. 항목 전체를 한 번에 보내며, 완료하면 이 시점에 재고가 차감된다.
 * 할당 수량보다 적게 집은 부분은 부족분이 되어 예약이 풀리고 발주에 미출고 수량으로 남는다.
 */
function PickingForm({
  outbound,
  onDone,
}: {
  outbound: OutboundDetails
  onDone: () => void
}) {
  const complete = useCompletePicking()
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      outbound.items.map((i) => [i.outboundLineId, String(i.allocatedQuantity)])
    )
  )
  const [confirmOpen, setConfirmOpen] = useState(false)

  const rows = outbound.items.map((item) => {
    const raw = quantities[item.outboundLineId] ?? ""
    const value = Number(raw)
    const valid =
      raw !== "" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= item.allocatedQuantity
    return { item, raw, value, valid }
  })
  const allValid = rows.every((r) => r.valid)
  const nothingPicked = rows.every((r) => r.value === 0)
  const shortage = rows.reduce(
    (sum, r) => sum + (r.valid ? r.item.allocatedQuantity - r.value : 0),
    0
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        실제로 집은 수량을 입력해 주세요. 입력한 수량만큼 재고가 차감되고, 적게
        집은 부분의 예약은 풀립니다.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>로트</TableHead>
            <TableHead>구역</TableHead>
            <TableHead className="text-right">할당</TableHead>
            <TableHead className="w-32">피킹 수량</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ item, raw, valid }) => (
            <TableRow key={item.outboundLineId}>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {item.skuCode}
                </span>{" "}
                {item.skuName}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {item.lotNumber}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.sectionCode}
              </TableCell>
              <TableCell className="text-right">
                {item.allocatedQuantity}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  max={item.allocatedQuantity}
                  aria-label={`${item.skuName} 피킹 수량`}
                  aria-invalid={!valid}
                  value={raw}
                  onChange={(e) =>
                    setQuantities((q) => ({
                      ...q,
                      [item.outboundLineId]: e.target.value,
                    }))
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!allValid && (
        <p className="text-sm text-destructive">
          피킹 수량은 0 이상, 할당 수량 이하의 정수여야 합니다.
        </p>
      )}
      {allValid && nothingPicked && (
        <p className="text-sm text-destructive">
          모든 항목이 0이면 피킹을 완료할 수 없습니다.
        </p>
      )}
      {allValid && shortage > 0 && !nothingPicked && (
        <p className="text-sm text-muted-foreground">
          부족 수량 합계 {shortage}. 부족분은 발주에 미출고 수량으로 남아 다시
          할당할 수 있습니다.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          disabled={!allValid || nothingPicked}
          onClick={() => {
            complete.reset()
            setConfirmOpen(true)
          }}
        >
          피킹 완료
        </Button>
        <Button variant="ghost" onClick={onDone}>
          닫기
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="피킹 완료"
        description="입력한 수량대로 재고가 차감됩니다. 완료한 뒤에는 피킹 수량을 바꿀 수 없고, 실물 차이는 재고 조정으로 정리해야 합니다."
        confirmLabel="피킹 완료"
        isPending={complete.isPending}
        error={
          complete.isError
            ? getErrorMessage(complete.error, "피킹 완료에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          complete.mutate(
            {
              outboundId: outbound.outboundId,
              lines: rows.map((r) => ({
                outboundLineId: r.item.outboundLineId,
                pickedQuantity: r.value,
              })),
            },
            {
              onSuccess: () => {
                setConfirmOpen(false)
                onDone()
              },
            }
          )
        }
      />
    </div>
  )
}

function LineTable({ items }: { items: OutboundLine[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        출고 항목이 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>로트</TableHead>
          <TableHead>유통기한</TableHead>
          <TableHead>구역</TableHead>
          <TableHead className="text-right">할당</TableHead>
          <TableHead className="text-right">출고</TableHead>
          <TableHead className="text-right">공급가</TableHead>
          <TableHead className="text-right">금액</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.outboundLineId}>
            <TableCell>
              <span className="font-mono text-xs text-muted-foreground">
                {item.skuCode}
              </span>{" "}
              {item.skuName}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {item.lotNumber}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.expiryDate ?? "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.sectionCode}
            </TableCell>
            <TableCell className="text-right">
              {item.allocatedQuantity}
            </TableCell>
            <TableCell className="text-right">{item.shippedQuantity}</TableCell>
            <TableCell className="text-right">
              {item.confirmedUnitSupplyPrice != null
                ? formatWon(item.confirmedUnitSupplyPrice)
                : "-"}
            </TableCell>
            <TableCell className="text-right">
              {item.lineAmount != null ? formatWon(item.lineAmount) : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

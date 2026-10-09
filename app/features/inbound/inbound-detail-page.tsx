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
import type { Inbound, InboundLine } from "~/lib/api/inbound"
import { useCurrentUser } from "~/lib/current-user"

import {
  useCancelInbound,
  useCompleteInbound,
  useInbound,
  useInboundDetails,
} from "./hooks"
import { InboundInspectForm } from "./inbound-inspect-form"

export function InboundDetailPage({ inboundId }: { inboundId: number }) {
  const inboundQuery = useInbound(inboundId)
  const linesQuery = useInboundDetails(inboundId)
  const [inspecting, setInspecting] = useState(false)
  const inbound = inboundQuery.data
  const items = linesQuery.data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {inboundQuery.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {inboundQuery.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(inboundQuery.error, "입고를 불러오지 못했습니다.")}
        </p>
      )}
      {inbound && (
        <InboundHeaderCard
          inbound={inbound}
          inspecting={inspecting}
          onToggleInspect={() => setInspecting((v) => !v)}
        />
      )}

      {inbound && (
        <Card>
          <CardHeader>
            <CardTitle>{inspecting ? "검수 입력" : "검수 항목"}</CardTitle>
          </CardHeader>
          <CardContent>
            {inspecting ? (
              <InboundInspectForm
                inboundId={inboundId}
                purchaseOrderId={inbound.purchaseOrderId}
                savedItems={items}
                onDone={() => setInspecting(false)}
              />
            ) : (
              <>
                {linesQuery.isLoading && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    불러오는 중...
                  </p>
                )}
                {linesQuery.isError && (
                  <p className="py-8 text-center text-sm text-destructive">
                    {getErrorMessage(
                      linesQuery.error,
                      "검수 항목을 불러오지 못했습니다."
                    )}
                  </p>
                )}
                {!linesQuery.isLoading && !linesQuery.isError && (
                  <LineTable items={items} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InboundHeaderCard({
  inbound,
  inspecting,
  onToggleInspect,
}: {
  inbound: Inbound
  inspecting: boolean
  onToggleInspect: () => void
}) {
  const { name, role } = useCurrentUser()
  const [completeOpen, setCompleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const complete = useCompleteInbound()
  const cancel = useCancelInbound()

  // 검수·완료·취소는 창고 관리자만(본사 관리자는 조회만). 완료·취소된 입고는 변경할 수 없다.
  const open = inbound.status === "ARRIVED" || inbound.status === "INSPECTING"
  const isManager = role === "WAREHOUSE_MANAGER"
  const canComplete =
    isManager && inbound.status === "INSPECTING" && inbound.lineCount > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-mono">{inbound.inboundNo}</CardTitle>
        {isManager && open && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onToggleInspect}>
              {inspecting
                ? "검수 입력 닫기"
                : inbound.status === "ARRIVED"
                  ? "검수 시작"
                  : "검수 수정"}
            </Button>
            {canComplete && !inspecting && (
              <Button
                size="sm"
                onClick={() => {
                  complete.reset()
                  setCompleteOpen(true)
                }}
              >
                입고 완료
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                cancel.reset()
                setCancelOpen(true)
              }}
            >
              입고 취소
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted-foreground">상태 </span>
          <StatusBadge status={inbound.status} />
        </p>
        <p>
          <span className="text-muted-foreground">발주 </span>
          <Link
            className="underline underline-offset-2"
            to={`/purchase-orders/${inbound.purchaseOrderId}`}
          >
            {inbound.purchaseOrderNo}
          </Link>
        </p>
        <p>
          <span className="text-muted-foreground">창고 </span>
          {inbound.warehouseName}
        </p>
        <p>
          <span className="text-muted-foreground">공급처 </span>
          {inbound.supplierName}
        </p>
        <p>
          <span className="text-muted-foreground">도착 </span>
          {formatDateTime(inbound.arrivedAt)}
        </p>
        <p>
          <span className="text-muted-foreground">입고 완료 </span>
          {formatDateTime(inbound.receivedAt)}
          {inbound.receivedBy != null && ` (사용자 #${inbound.receivedBy})`}
        </p>
        {inbound.note && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">비고 </span>
            {inbound.note}
          </p>
        )}
        {inbound.cancelReason && (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">취소 사유 </span>
            {inbound.cancelReason}
          </p>
        )}
        {isManager &&
          inbound.status === "INSPECTING" &&
          inbound.lineCount === 0 && (
            <p className="text-muted-foreground sm:col-span-2">
              검수 항목을 저장해야 입고를 완료할 수 있습니다.
            </p>
          )}
      </CardContent>

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="입고 완료"
        description={`검수 내용대로 재고와 발주 수량에 반영합니다. 완료한 뒤에는 취소·정정할 수 없고 재고 조정으로 처리해야 합니다. (처리자: ${name})`}
        confirmLabel="입고 완료"
        isPending={complete.isPending}
        error={
          complete.isError
            ? getErrorMessage(complete.error, "입고 완료에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          complete.mutate(
            { inboundId: inbound.inboundId },
            { onSuccess: () => setCompleteOpen(false) }
          )
        }
      />

      <ReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="입고 취소"
        description="취소해도 재고는 바뀌지 않습니다. 취소하면 같은 발주에 새 입고를 등록할 수 있습니다."
        submitLabel="입고 취소"
        destructive
        isPending={cancel.isPending}
        error={
          cancel.isError
            ? getErrorMessage(cancel.error, "취소에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          cancel.mutate(
            { inboundId: inbound.inboundId, reason },
            { onSuccess: () => setCancelOpen(false) }
          )
        }
      />
    </Card>
  )
}

function LineTable({ items }: { items: InboundLine[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        저장된 검수 항목이 없습니다.
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
          <TableHead className="text-right">입고</TableHead>
          <TableHead className="text-right">합격</TableHead>
          <TableHead className="text-right">불량</TableHead>
          <TableHead>합격 구역</TableHead>
          <TableHead>불량 구역</TableHead>
          <TableHead className="text-right">입고 단가</TableHead>
          <TableHead className="text-right">금액</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.inboundLineId}>
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
            <TableCell className="text-right">
              {item.receivedQuantity}
            </TableCell>
            <TableCell className="text-right">
              {item.acceptedQuantity}
            </TableCell>
            <TableCell className="text-right">
              {item.defectiveQuantity}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.acceptedSectionCode ?? "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.defectSectionCode ?? "-"}
            </TableCell>
            <TableCell className="text-right">
              {formatWon(item.receivedUnitPrice)}
              {item.priceChangeReason && (
                <span className="block text-xs text-muted-foreground">
                  {item.priceChangeReason}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right">
              {formatWon(item.lineAmount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

import { useState } from "react"
import { Link } from "react-router"

import { LinkRow } from "~/components/common/link-row"
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
import { useInbounds } from "~/features/inbound/hooks"
import { InboundRegisterDialog } from "~/features/inbound/inbound-register-dialog"
import { formatDateTime, formatWon } from "~/features/purchase-order/format"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { SupplierOrder } from "~/lib/api/supplier-order"
import { useCurrentUser } from "~/lib/current-user"

import { useSupplierOrder } from "./hooks"

export function SupplierOrderDetailPage({
  supplierOrderId,
}: {
  supplierOrderId: number
}) {
  const query = useSupplierOrder(supplierOrderId)
  const order = query.data

  // 발주서를 못 읽으면(403·404 등) 아래 카드도 같은 오류가 되므로 메시지만 한 번 보인다.
  if (query.isError) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "공급처 발주서를 불러오지 못했습니다.")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {query.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {order && (
        <>
          <HeaderCard order={order} />
          <LinesCard order={order} />
          <InboundsCard supplierOrderId={order.supplierOrderId} />
        </>
      )}
    </div>
  )
}

function HeaderCard({ order }: { order: SupplierOrder }) {
  const { role } = useCurrentUser()
  const [inboundOpen, setInboundOpen] = useState(false)
  // 입고는 담당 창고의 관리자만, 진행 중인 발주서에 대해서만 등록한다.
  const canRegisterInbound =
    role === "WAREHOUSE_MANAGER" &&
    (order.status === "ISSUED" || order.status === "PARTIALLY_RECEIVED")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-mono">{order.supplierOrderNo}</CardTitle>
        {canRegisterInbound && (
          <Button size="sm" onClick={() => setInboundOpen(true)}>
            입고 등록
          </Button>
        )}
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
          <span className="text-muted-foreground">공급처 </span>
          <Link
            className="underline underline-offset-2"
            to={`/suppliers/${order.supplierId}`}
          >
            {order.supplierName}
          </Link>
        </p>
        <p>
          <span className="text-muted-foreground">입고 창고 </span>
          {order.warehouseName}
        </p>
        <p>
          <span className="text-muted-foreground">창고 발주 요청 </span>
          <Link
            className="font-mono text-xs underline underline-offset-2"
            to={`/purchase-orders/${order.purchaseOrderId}`}
          >
            {order.purchaseOrderNo}
          </Link>
        </p>
        <p>
          <span className="text-muted-foreground">등록 </span>
          {formatDateTime(order.createdAt)}
        </p>
      </CardContent>

      <InboundRegisterDialog
        open={inboundOpen}
        onOpenChange={setInboundOpen}
        supplierOrderId={order.supplierOrderId}
      />
    </Card>
  )
}

function LinesCard({ order }: { order: SupplierOrder }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>발주 항목</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">발주 수량</TableHead>
              <TableHead className="text-right">입고 수량</TableHead>
              <TableHead className="text-right">잔여</TableHead>
              <TableHead className="text-right">단가</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.purchaseOrderLineId}>
                <TableCell>
                  <span className="block font-mono text-xs font-normal text-muted-foreground">
                    {line.skuCode}
                  </span>
                  {line.skuName}
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
      </CardContent>
    </Card>
  )
}

/** 이 발주서에 연결된 입고. 진행 중 입고는 발주서당 1건이다. */
function InboundsCard({ supplierOrderId }: { supplierOrderId: number }) {
  const query = useInbounds({ supplierOrderId })
  const inbounds = query.data?.items ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>입고</CardTitle>
      </CardHeader>
      <CardContent>
        {query.isLoading && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            불러오는 중...
          </p>
        )}
        {query.isError && (
          <p className="py-4 text-center text-sm text-destructive">
            {getErrorMessage(query.error, "입고를 불러오지 못했습니다.")}
          </p>
        )}
        {!query.isLoading && !query.isError && inbounds.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            등록된 입고가 없습니다.
          </p>
        )}
        {inbounds.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>입고 번호</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">검수 항목</TableHead>
                <TableHead>도착일시</TableHead>
                <TableHead>입고일시</TableHead>
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
                  <TableCell>
                    <StatusBadge status={inbound.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {inbound.lineCount}
                  </TableCell>
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
        )}
      </CardContent>
    </Card>
  )
}

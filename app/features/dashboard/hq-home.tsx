import { useState } from "react"
import { Link } from "react-router"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { StatusBadge } from "~/components/common/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Select } from "~/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { useSelectableWarehouses } from "~/features/purchase-order/hooks"
import type { CountQuantity } from "~/lib/api/dashboard"

import {
  QueryNotice,
  SectionTitle,
  StatCard,
  formatNumber,
  formatRate,
} from "./dashboard-parts"
import { useHqSummary, useHqTrends } from "./hooks"

/** 건수와 수량을 나란한 두 칸으로 보여 주는 입고·출고 카드. */
function FlowCard({
  label,
  flow,
  previous,
  hint,
  to,
}: {
  label: string
  flow: CountQuantity
  /** 있으면 건수·수량 아래에 전월 값과 증감을 보여 준다(완료 카드만). */
  previous?: CountQuantity
  hint?: string
  to: string
}) {
  return (
    <Link to={to} className="block h-full">
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">건수</p>
              <p className="text-2xl font-bold">{formatNumber(flow.count)}건</p>
              {previous && (
                <PreviousDiff
                  current={flow.count}
                  previous={previous.count}
                  unit="건"
                />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">수량</p>
              <p className="text-2xl font-bold">
                {formatNumber(flow.quantity)}개
              </p>
              {previous && (
                <PreviousDiff
                  current={flow.quantity}
                  previous={previous.quantity}
                  unit="개"
                />
              )}
            </div>
          </div>
          {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}

/** 전월 대비 증감을 "전월 19건 (+2)"로 보여 준다. 늘면 초록, 줄면 빨강, 같으면 기본색이다. */
function PreviousDiff({
  current,
  previous,
  unit,
}: {
  current: number
  previous: number
  unit: string
}) {
  const diff = current - previous
  const color =
    diff > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : diff < 0
        ? "text-red-600 dark:text-red-400"
        : ""
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      전월 {formatNumber(previous)}
      {unit}{" "}
      <span className={`font-medium ${color}`}>
        ({diff > 0 ? "+" : ""}
        {formatNumber(diff)})
      </span>
    </p>
  )
}

/** "2026-10"을 "2026년 10월"로 표시한다. */
function formatMonthTitle(month: string) {
  const [year, mm] = month.split("-")
  return `${year}년 ${Number(mm)}월`
}

/** 오늘이 속한 달 `YYYY-MM`. 미래 달은 고르지 못하게 하는 상한이다. */
function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function HqHome() {
  // 비어 있으면 현재 달. 서버가 내려준 data.month로 제목과 선택 값을 채운다.
  const [month, setMonth] = useState("")
  const summary = useHqSummary(month)
  const data = summary.data

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <QueryNotice
        isLoading={summary.isLoading}
        isError={summary.isError}
        error={summary.error}
      />
      {data && (
        <>
          <div className="flex flex-wrap items-center gap-8">
            <h1 className="text-3xl font-bold">
              {formatMonthTitle(data.month)}
            </h1>
            <div className="w-40">
              <Input
                type="month"
                value={data.month}
                max={currentMonth()}
                onChange={(e) => e.target.value && setMonth(e.target.value)}
              />
            </div>
          </div>

          <section className="space-y-3">
            <SectionTitle>입고·출고</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FlowCard
                label="입고 완료"
                flow={data.inbound.completed}
                previous={data.inbound.previousMonthCompleted}
                to="/inbounds"
              />
              <FlowCard
                label="출고 완료"
                flow={data.outbound.completed}
                previous={data.outbound.previousMonthCompleted}
                to="/outbounds"
              />
              <FlowCard
                label="입고 진행중 (현재)"
                flow={data.inbound.inProgress}
                hint="검수 중"
                to="/inbounds"
              />
              <FlowCard
                label="출고 진행중 (현재)"
                flow={data.outbound.inProgress}
                hint="피킹~배송 중"
                to="/outbounds"
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>지점 발주</SectionTitle>
            <Card size="sm">
              <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">총 발주</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(data.storeOrders.totalCount)}건
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">완료율</p>
                  <p className="text-2xl font-bold">
                    {formatRate(data.storeOrders.completionRate)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  {Object.entries(data.storeOrders.byStatus).map(
                    ([status, count]) => (
                      <div key={status} className="flex items-center gap-2.5">
                        <StatusBadge
                          status={status}
                          className="text-base tracking-normal"
                        />
                        <span className="text-xl font-bold">
                          {formatNumber(count)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionTitle>창고별 현황</SectionTitle>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>창고</TableHead>
                      <TableHead className="text-right">재고(현재)</TableHead>
                      <TableHead className="text-right">
                        부족 SKU(현재)
                      </TableHead>
                      <TableHead className="text-right">입고 완료</TableHead>
                      <TableHead className="text-right">출고 완료</TableHead>
                      <TableHead className="text-right">
                        입고 진행(현재)
                      </TableHead>
                      <TableHead className="text-right">
                        출고 진행(현재)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.warehouses.map((w) => (
                      <TableRow key={w.warehouseId}>
                        <TableCell className="font-medium">
                          {w.warehouseName}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(w.inventoryQuantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(w.lowStockSkuCount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(w.inbound.completedQuantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(w.outbound.completedQuantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(w.inbound.inProgressQuantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(w.outbound.inProgressQuantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t pt-6">
            <h1 className="text-xl font-bold">현재 기준</h1>
            <p className="text-sm text-muted-foreground">
              선택한 달과 관계없는 값입니다. 현재 시점 값과 최근 6개월
              추이입니다.
            </p>
          </div>

          <section className="space-y-3">
            <SectionTitle>조치 대기</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="지점 발주 승인 대기"
                value={`${formatNumber(data.pending.storeOrderRequestedCount)}건`}
                to="/store-orders?status=REQUESTED"
                highlight={data.pending.storeOrderRequestedCount > 0}
              />
              <StatCard
                label="창고 발주 확정 대기"
                value={`${formatNumber(data.pending.purchaseOrderRequestedCount)}건`}
                to="/purchase-orders?status=REQUESTED"
                highlight={data.pending.purchaseOrderRequestedCount > 0}
              />
              <StatCard
                label="창고 배정 전 승인 발주"
                value={`${formatNumber(data.pending.unassignedApprovedStoreOrderCount)}건`}
                to="/store-orders?status=APPROVED"
                highlight={data.pending.unassignedApprovedStoreOrderCount > 0}
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>재고 현황</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="정상 재고 수량"
                value={formatNumber(data.inventory.totalQuantity)}
                hint={`활성 SKU ${formatNumber(data.inventory.activeSkuCount)}개`}
                to="/inventory"
              />
              <StatCard
                label="부족 재고 SKU"
                value={`${formatNumber(data.inventory.lowStockSkuCount)}개`}
                to="/inventory?tab=low-stock"
                highlight={data.inventory.lowStockSkuCount > 0}
              />
              <StatCard
                label="유통기한 임박 로트"
                value={`${formatNumber(data.inventory.expiringLotCount)}개`}
                hint="30일 이내"
                to="/inventory"
                highlight={data.inventory.expiringLotCount > 0}
              />
              <StatCard
                label="제외된 재고"
                value={formatNumber(
                  data.inventory.quarantinedQuantity +
                    data.inventory.disposedQuantity +
                    data.inventory.expiredQuantity +
                    data.inventory.defectiveQuantity
                )}
                hint={`격리 ${formatNumber(data.inventory.quarantinedQuantity)} · 폐기 ${formatNumber(data.inventory.disposedQuantity)} · 만료 ${formatNumber(data.inventory.expiredQuantity)} · 불량 ${formatNumber(data.inventory.defectiveQuantity)}`}
              />
            </div>
          </section>
        </>
      )}

      <TrendsSection />
    </main>
  )
}

/** 무거운 집계라 summary와 따로 불러, 실패해도 위쪽 카드는 그대로 보이게 한다. */
function TrendsSection() {
  const warehouses = useSelectableWarehouses()
  const [warehouseId, setWarehouseId] = useState("")
  const trends = useHqTrends(warehouseId ? Number(warehouseId) : null)
  const data = trends.data

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-8">
        <SectionTitle>월간 추이 (최근 6개월 완료 수량)</SectionTitle>
        <div className="w-48">
          <Select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">전체 창고</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.warehouseName}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <QueryNotice
        isLoading={trends.isLoading}
        isError={trends.isError}
        error={trends.error}
      />
      {data && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="h-full xl:col-span-2">
            <CardContent className="h-72 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.items}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} />
                  <YAxis tickLine={false} width={56} />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Legend />
                  <Bar
                    dataKey="inboundCompletedQuantity"
                    name="입고 완료"
                    fill="var(--color-chart-2)"
                  />
                  <Bar
                    dataKey="outboundCompletedQuantity"
                    name="출고 완료"
                    fill="var(--color-chart-4)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">이번 달 출고 상위 SKU</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topOutboundSkus.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  이번 달 출고 완료 내역이 없습니다.
                </p>
              ) : (
                <ul className="space-y-4">
                  {data.topOutboundSkus.map((sku) => (
                    <li
                      key={sku.skuId}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate">{sku.skuName}</span>
                      <span className="shrink-0 font-medium">
                        {formatNumber(sku.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}

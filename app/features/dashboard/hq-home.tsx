import { useState } from "react"
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
import type { FlowSummary } from "~/lib/api/dashboard"

import {
  QueryNotice,
  SectionTitle,
  StatCard,
  formatNumber,
  formatRate,
} from "./dashboard-parts"
import { useHqSummary, useHqTrends } from "./hooks"

/** 전월 대비 증감을 "전월 9,100 (+700)" 형태로 보여 준다. */
function flowHint(flow: FlowSummary) {
  const prev = flow.previousMonthCompleted.quantity
  const diff = flow.completed.quantity - prev
  return `전월 ${formatNumber(prev)} (${diff >= 0 ? "+" : ""}${formatNumber(diff)})`
}

export function HqHome() {
  const summary = useHqSummary()
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
          <section className="space-y-3">
            <SectionTitle>조치 대기</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="지점 발주 승인 대기"
                value={`${formatNumber(data.pending.storeOrderRequestedCount)}건`}
                to="/store-orders"
                highlight={data.pending.storeOrderRequestedCount > 0}
              />
              <StatCard
                label="창고 발주 확정 대기"
                value={`${formatNumber(data.pending.purchaseOrderRequestedCount)}건`}
                to="/purchase-orders"
                highlight={data.pending.purchaseOrderRequestedCount > 0}
              />
              <StatCard
                label="창고 배정 전 승인 발주"
                value={`${formatNumber(data.pending.unassignedApprovedStoreOrderCount)}건`}
                to="/store-orders"
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
                to="/inventory"
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

          <section className="space-y-3">
            <SectionTitle>{data.month} 입고·출고</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="입고 완료 수량"
                value={formatNumber(data.inbound.completed.quantity)}
                hint={`${formatNumber(data.inbound.completed.count)}건 · ${flowHint(data.inbound)}`}
                to="/inbounds"
              />
              <StatCard
                label="입고 진행중"
                value={formatNumber(data.inbound.inProgress.quantity)}
                hint={`${formatNumber(data.inbound.inProgress.count)}건 (검수 중)`}
                to="/inbounds"
              />
              <StatCard
                label="출고 완료 수량"
                value={formatNumber(data.outbound.completed.quantity)}
                hint={`${formatNumber(data.outbound.completed.count)}건 · ${flowHint(data.outbound)}`}
                to="/outbounds"
              />
              <StatCard
                label="출고 진행중"
                value={formatNumber(data.outbound.inProgress.quantity)}
                hint={`${formatNumber(data.outbound.inProgress.count)}건 (피킹~배송 중)`}
                to="/outbounds"
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>{data.month} 지점 발주</SectionTitle>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6">
                <div>
                  <p className="text-xs text-muted-foreground">완료율</p>
                  <p className="text-2xl font-bold">
                    {formatRate(data.storeOrders.completionRate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    총 {formatNumber(data.storeOrders.totalCount)}건 (취소·반려
                    제외 기준)
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(data.storeOrders.byStatus).map(
                    ([status, count]) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <StatusBadge status={status} />
                        <span className="text-sm font-medium">
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
                      <TableHead className="text-right">재고</TableHead>
                      <TableHead className="text-right">부족 SKU</TableHead>
                      <TableHead className="text-right">입고 완료</TableHead>
                      <TableHead className="text-right">입고 진행</TableHead>
                      <TableHead className="text-right">출고 완료</TableHead>
                      <TableHead className="text-right">출고 진행</TableHead>
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
                          {formatNumber(w.inbound.inProgressQuantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(w.outbound.completedQuantity)}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <Card className="xl:col-span-2">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">이번 달 출고 상위 SKU</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topOutboundSkus.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  이번 달 출고 완료 내역이 없습니다.
                </p>
              ) : (
                <ol className="space-y-2">
                  {data.topOutboundSkus.map((sku, index) => (
                    <li
                      key={sku.skuId}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate">
                        {index + 1}. {sku.skuName}
                      </span>
                      <span className="shrink-0 font-medium">
                        {formatNumber(sku.quantity)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}

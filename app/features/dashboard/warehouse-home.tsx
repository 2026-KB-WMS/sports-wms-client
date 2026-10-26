import { useState } from "react"

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

import {
  QueryNotice,
  SectionTitle,
  StatCard,
  formatNumber,
  formatRate,
} from "./dashboard-parts"
import { useWarehouseSummary } from "./hooks"

export function WarehouseHome() {
  const warehouses = useSelectableWarehouses()
  const [selectedId, setSelectedId] = useState("")
  // 담당 창고가 여럿이면 서버가 warehouseId를 필수로 요구하므로 첫 창고를 기본으로 쓴다.
  const warehouseId = selectedId
    ? Number(selectedId)
    : (warehouses[0]?.warehouseId ?? null)
  const summary = useWarehouseSummary(warehouseId)
  const data = summary.data

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {warehouses.length > 1 && (
        <div className="w-56">
          <Select
            value={warehouseId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.warehouseName}
              </option>
            ))}
          </Select>
        </div>
      )}
      {warehouseId == null ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          담당 창고가 없습니다.
        </p>
      ) : (
        <QueryNotice
          isLoading={summary.isLoading}
          isError={summary.isError}
          error={summary.error}
        />
      )}
      {data && (
        <>
          <section className="space-y-3">
            <SectionTitle>{data.warehouseName} 입고 작업</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="검수 전 (도착)"
                value={`${formatNumber(data.pending.inbound.arrivedCount)}건`}
                to="/inbounds"
                highlight={data.pending.inbound.arrivedCount > 0}
              />
              <StatCard
                label="검수 중"
                value={`${formatNumber(data.pending.inbound.inspectingCount)}건`}
                to="/inbounds"
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>출고 작업</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="피킹 전 (출고 준비)"
                value={`${formatNumber(data.pending.outbound.readyCount)}건`}
                to="/outbounds"
                highlight={data.pending.outbound.readyCount > 0}
              />
              <StatCard
                label="피킹 작업 중"
                value={`${formatNumber(data.pending.outbound.pickingCount)}건`}
                to="/outbounds"
              />
              <StatCard
                label="배송 중"
                value={`${formatNumber(data.pending.outbound.shippedCount)}건`}
                to="/outbounds"
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>수용량</SectionTitle>
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-2xl font-bold">
                    {formatRate(data.capacity.usageRate)}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      사용 중
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(data.capacity.currentCapacity)} /{" "}
                    {formatNumber(data.capacity.capacity)} · 여유{" "}
                    {formatNumber(data.capacity.availableCapacity)}
                  </p>
                </div>
                <div className="h-2 overflow-hidden bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(100, Math.round((data.capacity.usageRate ?? 0) * 100))}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionTitle>재고 주의</SectionTitle>
            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">
                    부족 재고 SKU{" "}
                    {formatNumber(data.inventory.lowStockSkuCount)}개 (부족 폭
                    상위 5개)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.inventory.lowStockSkus.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      부족한 재고가 없습니다.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">가용</TableHead>
                          <TableHead className="text-right">안전재고</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.inventory.lowStockSkus.map((sku) => (
                          <TableRow key={sku.skuId}>
                            <TableCell>
                              <span className="font-medium">{sku.skuName}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {sku.skuCode}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(sku.availableQuantity)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(sku.safetyStockQuantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              <StatCard
                label="유통기한 임박 로트"
                value={`${formatNumber(data.inventory.expiringLotCount)}개`}
                hint="30일 이내"
                to="/inventory"
                highlight={data.inventory.expiringLotCount > 0}
              />
            </div>
          </section>
        </>
      )}
    </main>
  )
}

import { Boxes, Package, Store, Warehouse } from "lucide-react"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"

/**
 * 대시보드 집계 API가 아직 없어 카드 값은 자리표시자다.
 * 도메인별 화면(상품/창고/재고/지점)이 붙으면 실제 API로 교체한다.
 */
const summaryCards = [
  { label: "상품", icon: Package },
  { label: "창고", icon: Warehouse },
  { label: "재고 부족 품목", icon: Boxes },
  { label: "지점", icon: Store },
]

/** 표 형태를 보여주기 위한 예시 데이터. 실제 재고 API 연동 전까지만 사용한다. */
const sampleInventory = [
  { sku: "SKU-1024", name: "배드민턴 라켓 A", warehouse: "중앙 창고", quantity: 128, status: "정상" },
  { sku: "SKU-1035", name: "셔틀콕 12입", warehouse: "동부 창고", quantity: 18, status: "부족" },
  { sku: "SKU-1041", name: "운동화 260mm", warehouse: "중앙 창고", quantity: 64, status: "정상" },
]

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="개요" title="전체 현황" description="창고·재고 현황을 한눈에 확인하세요." />

        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <card.icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">—</p>
                  <p className="mt-1 text-xs text-muted-foreground">API 연동 예정</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>재고 현황</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  실제 재고 API 연동 전 화면 구조 확인용 예시입니다.
                </p>
              </div>
              <Badge variant="secondary">예시 데이터</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>상품명</TableHead>
                    <TableHead>창고</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleInventory.map((row) => (
                    <TableRow key={row.sku}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.sku}
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">{row.warehouse}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "부족" ? "destructive" : "outline"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

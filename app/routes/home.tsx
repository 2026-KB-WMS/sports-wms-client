import { Boxes, Package, Store, Warehouse } from "lucide-react"
import { Navigate } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { useCurrentUser } from "~/lib/current-user"

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

export default function Home() {
  const { role } = useCurrentUser()
  // 점주는 개요(창고·재고 현황)를 볼 수 없다. 서버 권한 기준은 아니고 화면 노출만 막는다.
  if (role === "STORE_OWNER") return <Navigate to="/store-orders" replace />

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
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

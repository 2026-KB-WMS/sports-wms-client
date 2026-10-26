import { Navigate } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { HqHome } from "~/features/dashboard/hq-home"
import { WarehouseHome } from "~/features/dashboard/warehouse-home"
import { useCurrentUser } from "~/lib/current-user"

export default function Home() {
  const { role } = useCurrentUser()
  // 점주 홈은 아직 없다(서버 대시보드도 범위 밖). 서버 권한 기준은 아니고 화면 노출만 막는다.
  if (role === "STORE_OWNER") return <Navigate to="/store-orders" replace />

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="개요" />
        {role === "HQ_ADMIN" ? <HqHome /> : <WarehouseHome />}
      </SidebarInset>
    </SidebarProvider>
  )
}

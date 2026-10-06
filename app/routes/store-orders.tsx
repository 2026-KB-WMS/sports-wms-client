import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { StoreOrderPage } from "~/features/store-order/store-order-page"

export default function StoreOrders() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="지점 발주"
          title="지점 발주 관리"
          description="지점이 창고에 요청한 발주를 등록하고 처리합니다."
        />
        <StoreOrderPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

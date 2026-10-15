import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { SupplierOrderPage } from "~/features/supplier-order/supplier-order-page"

export default function SupplierOrders() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="공급처 발주서"
          title="공급처 발주서"
          description="확정된 창고 발주 요청에서 공급처별로 생성된 발주서를 확인합니다."
        />
        <SupplierOrderPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

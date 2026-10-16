import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { PurchaseOrderPage } from "~/features/purchase-order/purchase-order-page"

export default function PurchaseOrders() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="창고 발주" title="창고 발주 관리" />
        <PurchaseOrderPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { SupplierOrderPage } from "~/features/supplier-order/supplier-order-page"

export default function SupplierOrders() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="공급처 발주서" title="공급처 발주서" />
        <SupplierOrderPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

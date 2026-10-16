import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { SupplierPage } from "~/features/supplier/supplier-page"

export default function Suppliers() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="공급처" title="공급처 관리" />
        <SupplierPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { WarehousePage } from "~/features/warehouse/warehouse-page"

export default function Warehouses() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="창고" title="창고 관리" />
        <WarehousePage />
      </SidebarInset>
    </SidebarProvider>
  )
}

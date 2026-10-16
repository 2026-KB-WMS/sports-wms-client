import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { InventoryPage } from "~/features/inventory/inventory-page"

export default function Inventory() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="재고" title="재고 관리" />
        <InventoryPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

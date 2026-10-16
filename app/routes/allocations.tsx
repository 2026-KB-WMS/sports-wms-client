import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { AllocationPage } from "~/features/outbound/allocation-page"

export default function Allocations() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="재고 할당" title="재고 할당" />
        <AllocationPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

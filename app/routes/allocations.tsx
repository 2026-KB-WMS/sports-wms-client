import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { AllocationPage } from "~/features/outbound/allocation-page"

export default function Allocations() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="재고 할당"
          title="재고 할당"
          description="지점 발주에 예약된 재고를 확인하고 해제합니다."
        />
        <AllocationPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { InboundPage } from "~/features/inbound/inbound-page"

export default function Inbounds() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="입고"
          title="입고 관리"
          description="도착한 물품을 검수하고 재고에 반영합니다."
        />
        <InboundPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { OutboundPage } from "~/features/outbound/outbound-page"

export default function Outbounds() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="출고"
          title="출고 관리"
          description="피킹부터 배송까지 출고를 처리합니다."
        />
        <OutboundPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

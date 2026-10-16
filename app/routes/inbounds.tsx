import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { InboundPage } from "~/features/inbound/inbound-page"

export default function Inbounds() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="입고" title="입고 관리" />
        <InboundPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

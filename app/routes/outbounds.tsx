import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { OutboundPage } from "~/features/outbound/outbound-page"

export default function Outbounds() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="출고" title="출고 관리" />
        <OutboundPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

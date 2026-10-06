import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { StorePage } from "~/features/store/store-page"

export default function Stores() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="지점"
          title="지점 관리"
          description="지점을 등록하고 점주를 배정합니다."
        />
        <StorePage />
      </SidebarInset>
    </SidebarProvider>
  )
}

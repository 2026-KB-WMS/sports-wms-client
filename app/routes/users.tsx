import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { UserPage } from "~/features/user/user-page"

export default function Users() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="사용자"
          title="사용자 관리"
          description="가입 신청을 승인하고 계정 정보와 상태를 관리합니다."
        />
        <UserPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

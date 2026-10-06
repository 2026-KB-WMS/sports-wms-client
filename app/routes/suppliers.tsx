import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { SupplierPage } from "~/features/supplier/supplier-page"

export default function Suppliers() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="공급처"
          title="공급처 관리"
          description="발주 대상 공급처를 등록하고 관리합니다."
        />
        <SupplierPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

import { useParams } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { SupplierDetailPage } from "~/features/supplier/supplier-detail-page"

export default function SupplierDetail() {
  const { supplierId } = useParams<{ supplierId: string }>()
  const id = Number(supplierId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="공급처"
          title="공급처 상세"
          description="공급처 정보를 확인하고 수정합니다."
        />
        {Number.isFinite(id) ? (
          <SupplierDetailPage supplierId={id} />
        ) : (
          <p className="p-6 text-sm text-destructive">
            잘못된 공급처 ID입니다.
          </p>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

import { useParams } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { WarehouseDetailPage } from "~/features/warehouse/warehouse-detail-page"

export default function WarehouseDetail() {
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const id = Number(warehouseId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="창고" title="창고 상세" />
        {Number.isFinite(id) ? (
          <WarehouseDetailPage warehouseId={id} />
        ) : (
          <p className="p-6 text-sm text-destructive">잘못된 창고 ID입니다.</p>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

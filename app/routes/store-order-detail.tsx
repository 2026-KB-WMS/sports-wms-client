import { useParams } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { StoreOrderDetailPage } from "~/features/store-order/store-order-detail-page"

export default function StoreOrderDetail() {
  const { storeOrderId } = useParams<{ storeOrderId: string }>()
  const id = Number(storeOrderId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="지점 발주" title="지점 발주 상세" />
        {Number.isFinite(id) ? (
          <StoreOrderDetailPage storeOrderId={id} />
        ) : (
          <p className="p-6 text-sm text-destructive">잘못된 발주 ID입니다.</p>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

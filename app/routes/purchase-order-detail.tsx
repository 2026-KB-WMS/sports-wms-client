import { useParams } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { PurchaseOrderDetailPage } from "~/features/purchase-order/purchase-order-detail-page"

export default function PurchaseOrderDetail() {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>()
  const id = Number(purchaseOrderId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="창고 발주" title="창고 발주 상세" />
        {Number.isFinite(id) ? (
          <PurchaseOrderDetailPage purchaseOrderId={id} />
        ) : (
          <p className="p-6 text-sm text-destructive">잘못된 발주 ID입니다.</p>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

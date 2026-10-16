import { useParams } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { SupplierOrderDetailPage } from "~/features/supplier-order/supplier-order-detail-page"

export default function SupplierOrderDetail() {
  const { supplierOrderId } = useParams<{ supplierOrderId: string }>()
  const id = Number(supplierOrderId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="공급처 발주서" title="공급처 발주서 상세" />
        {Number.isFinite(id) ? (
          <SupplierOrderDetailPage supplierOrderId={id} />
        ) : (
          <p className="p-6 text-sm text-destructive">
            잘못된 공급처 발주서 ID입니다.
          </p>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

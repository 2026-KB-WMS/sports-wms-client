import { useParams } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { StoreDetailPage } from "~/features/store/store-detail-page"

export default function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>()
  const id = Number(storeId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="지점" title="지점 상세" />
        {Number.isFinite(id) ? (
          <StoreDetailPage storeId={id} />
        ) : (
          <p className="p-6 text-sm text-destructive">잘못된 지점 ID입니다.</p>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

import { useParams } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { OutboundDetailPage } from "~/features/outbound/outbound-detail-page"

export default function OutboundDetail() {
  const { outboundId } = useParams<{ outboundId: string }>()
  const id = Number(outboundId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="출고" title="출고 상세" />
        {Number.isFinite(id) ? (
          <OutboundDetailPage outboundId={id} />
        ) : (
          <p className="p-6 text-sm text-destructive">잘못된 출고 ID입니다.</p>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

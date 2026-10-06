import { useParams } from "react-router"

import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { InboundDetailPage } from "~/features/inbound/inbound-detail-page"

export default function InboundDetail() {
  const { inboundId } = useParams<{ inboundId: string }>()
  const id = Number(inboundId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="입고"
          title="입고 상세"
          description="검수 항목을 입력하고 입고를 완료합니다."
        />
        {Number.isFinite(id) ? (
          <InboundDetailPage inboundId={id} />
        ) : (
          <p className="p-6 text-sm text-destructive">잘못된 입고 ID입니다.</p>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

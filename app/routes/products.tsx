import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { ProductPage } from "~/features/product/product-page"

export default function Products() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          section="상품"
          title="상품 관리"
          description="상품과 SKU를 등록하고 조회합니다."
        />
        <ProductPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

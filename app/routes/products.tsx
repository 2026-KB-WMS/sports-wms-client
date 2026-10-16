import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { ProductPage } from "~/features/product/product-page"

export default function Products() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader section="상품" title="상품 관리" />
        <ProductPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

import { Link } from "react-router"
import { LayoutDashboard, Package, Warehouse, Boxes, Store, Box } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"

/**
 * 도메인별 화면은 순서대로 구현되며(상품 -> 창고 -> 재고 -> 지점),
 * 아직 라우트가 없는 항목은 href를 "#"으로 두고 비활성 처리한다.
 */
const navItems = [
  { label: "개요", icon: LayoutDashboard, href: "/", enabled: true },
  { label: "상품", icon: Package, href: "#", enabled: false },
  { label: "창고", icon: Warehouse, href: "#", enabled: false },
  { label: "재고", icon: Boxes, href: "#", enabled: false },
  { label: "지점", icon: Store, href: "#", enabled: false },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Box className="size-4" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            WMS 창고 관리
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>워크스페이스</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) =>
                item.enabled ? (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive
                      tooltip={item.label}
                      render={
                        <Link to={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton disabled tooltip={`${item.label} (준비 중)`}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          로그인 연동 예정
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

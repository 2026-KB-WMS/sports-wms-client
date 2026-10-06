import { Link } from "react-router"
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Boxes,
  Store,
  Box,
} from "lucide-react"

import { DevUserSwitcher } from "~/components/layout/dev-user-switcher"
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
import { type Role, useCurrentUser } from "~/lib/current-user"

/**
 * 메뉴는 역할별로 노출한다(roles). 도메인별 화면은 순서대로 구현되며,
 * 아직 라우트가 없는 항목은 href를 "#"으로 두고 비활성 처리한다.
 * 역할별 접근 범위의 기준은 wms-server docs/api/*.md의 권한 표다.
 */
const ALL_ROLES: Role[] = ["HQ_ADMIN", "WAREHOUSE_MANAGER", "STORE_OWNER"]

const navItems: {
  label: string
  icon: typeof Box
  href: string
  enabled: boolean
  roles: Role[]
}[] = [
  { label: "개요", icon: LayoutDashboard, href: "/", enabled: true, roles: ALL_ROLES },
  { label: "상품", icon: Package, href: "/products", enabled: true, roles: ALL_ROLES },
  {
    label: "창고",
    icon: Warehouse,
    href: "/warehouses",
    enabled: true,
    roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
  },
  {
    label: "재고",
    icon: Boxes,
    href: "/inventory",
    enabled: true,
    roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
  },
  {
    label: "지점",
    icon: Store,
    href: "/stores",
    enabled: true,
    roles: ["HQ_ADMIN", "STORE_OWNER"],
  },
]

export function AppSidebar() {
  const { role } = useCurrentUser()
  const visibleItems = navItems.filter((item) => item.roles.includes(role))

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
              {visibleItems.map((item) =>
                item.enabled ? (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
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
                    <SidebarMenuButton
                      disabled
                      tooltip={`${item.label} (준비 중)`}
                    >
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
        <DevUserSwitcher />
      </SidebarFooter>
    </Sidebar>
  )
}

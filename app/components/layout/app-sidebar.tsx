import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Boxes,
  Store,
  Truck,
  ClipboardList,
  PackageCheck,
  ShoppingCart,
  Layers,
  PackageOpen,
  Box,
  KeyRound,
  Users,
  LogOut,
  ChevronDown,
} from "lucide-react"

import { ChangePasswordDialog } from "~/features/auth/change-password-dialog"
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
  useSidebar,
} from "~/components/ui/sidebar"
import { cn } from "~/lib/utils"
import { type Role, getRoleLabel, useCurrentUser } from "~/lib/current-user"

/**
 * 메뉴는 역할별로 노출한다(roles). 도메인별 화면은 순서대로 구현되며,
 * 아직 라우트가 없는 항목은 href를 "#"으로 두고 비활성 처리한다.
 * 역할별 접근 범위의 기준은 wms-server docs/api/*.md의 권한 표다.
 */

type NavItem = {
  label: string
  icon: typeof Box
  href: string
  enabled: boolean
  roles: Role[]
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "워크스페이스",
    items: [
      {
        label: "개요",
        icon: LayoutDashboard,
        href: "/",
        enabled: true,
        roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        label: "상품",
        icon: Package,
        href: "/products",
        enabled: true,
        roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
      },
    ],
  },
  {
    label: "창고",
    items: [
      {
        label: "창고",
        icon: Warehouse,
        href: "/warehouses",
        enabled: true,
        roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        label: "공급처",
        icon: Truck,
        href: "/suppliers",
        enabled: true,
        roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        label: "창고 발주",
        icon: ClipboardList,
        href: "/purchase-orders",
        enabled: true,
        roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        label: "입고",
        icon: PackageCheck,
        href: "/inbounds",
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
        label: "재고 할당",
        icon: Layers,
        href: "/allocations",
        enabled: true,
        roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        label: "출고",
        icon: PackageOpen,
        href: "/outbounds",
        enabled: true,
        roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER"],
      },
    ],
  },
  {
    label: "지점",
    items: [
      {
        label: "지점",
        icon: Store,
        href: "/stores",
        enabled: true,
        roles: ["HQ_ADMIN", "STORE_OWNER"],
      },
      {
        label: "지점 발주",
        icon: ShoppingCart,
        href: "/store-orders",
        enabled: true,
        roles: ["HQ_ADMIN", "WAREHOUSE_MANAGER", "STORE_OWNER"],
      },
    ],
  },
  {
    label: "관리",
    items: [
      {
        label: "사용자",
        icon: Users,
        href: "/users",
        enabled: true,
        roles: ["HQ_ADMIN"],
      },
    ],
  },
]

export function AppSidebar() {
  const { role, name, loginId, logout } = useCurrentUser()
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [closedGroups, setClosedGroups] = useState<string[]>([])
  const { state } = useSidebar()
  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0)

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
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel
              render={
                <button
                  type="button"
                  className="cursor-pointer justify-between hover:text-sidebar-foreground"
                  aria-expanded={!closedGroups.includes(group.label)}
                  onClick={() =>
                    setClosedGroups((prev) =>
                      prev.includes(group.label)
                        ? prev.filter((l) => l !== group.label)
                        : [...prev, group.label]
                    )
                  }
                />
              }
            >
              {group.label}
              <ChevronDown
                className={cn(
                  "transition-transform",
                  closedGroups.includes(group.label) && "-rotate-90"
                )}
              />
            </SidebarGroupLabel>
            {/* 아이콘 모드에서는 라벨이 숨겨지므로 접힘과 무관하게 항목을 보여 준다 */}
            <SidebarGroupContent
              hidden={
                state === "expanded" && closedGroups.includes(group.label)
              }
            >
              <SidebarMenu>
                {group.items.map((item) =>
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
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex flex-col gap-1 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {getRoleLabel(role)} · {loginId}
          </p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="비밀번호 변경"
              onClick={() => setPasswordOpen(true)}
            >
              <KeyRound />
              <span>비밀번호 변경</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="로그아웃"
              onClick={() => {
                logout()
                navigate("/login")
              }}
            >
              <LogOut />
              <span>로그아웃</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ChangePasswordDialog
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
        />
      </SidebarFooter>
    </Sidebar>
  )
}

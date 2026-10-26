import { Bell, ChevronRight } from "lucide-react"

import { Input } from "~/components/ui/input"
import { SidebarTrigger, useSidebar } from "~/components/ui/sidebar"

interface AppHeaderProps {
  section: string
  /** 비우면 제목 줄을 그리지 않는다(화면 안에 자체 제목이 있는 홈). */
  title?: string
  description?: string
}

export function AppHeader({ section, title, description }: AppHeaderProps) {
  const { isMobile, state, openMobile } = useSidebar()
  // 사이드바 안의 토글로 닫는다. 숨겨졌을 때만 다시 여는 버튼을 보인다.
  const sidebarHidden = isMobile ? !openMobile : state === "collapsed"
  return (
    <>
      {/* 경로·검색 줄만 스크롤해도 상단에 고정한다. */}
      <header className="sticky top-0 z-20 border-b bg-background px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {sidebarHidden && <SidebarTrigger />}
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span>워크스페이스</span>
              <ChevronRight className="size-3" />
              <span className="text-foreground">{section}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="검색"
              className="hidden w-56 sm:block"
              disabled
            />
            <button
              type="button"
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="알림"
              disabled
            >
              <Bell className="size-4" />
            </button>
          </div>
        </div>
      </header>
      {title && (
        <div className="border-b bg-background px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </>
  )
}

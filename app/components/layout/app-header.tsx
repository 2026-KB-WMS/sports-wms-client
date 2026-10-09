import { Bell, ChevronRight } from "lucide-react"

import { Input } from "~/components/ui/input"
import { SidebarTrigger } from "~/components/ui/sidebar"

interface AppHeaderProps {
  section: string
  title: string
  description?: string
}

export function AppHeader({ section, title, description }: AppHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b bg-background px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span>워크스페이스</span>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{section}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="검색" className="hidden w-56 sm:block" disabled />
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
  )
}

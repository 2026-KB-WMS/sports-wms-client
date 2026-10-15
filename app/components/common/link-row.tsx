import type { ComponentProps } from "react"
import { cn } from "cn"
import { useNavigate } from "react-router"

import { TableRow } from "~/components/ui/table"

/**
 * 행 전체를 눌러 상세로 이동하는 표 행. 행 안에 다른 버튼을 두지 않는다.
 * `to`가 없으면(권한 없음 등) 클릭·호버 효과 없는 일반 행이다.
 */
export function LinkRow({
  to,
  className,
  ...props
}: { to?: string } & ComponentProps<"tr">) {
  const navigate = useNavigate()
  if (!to) return <TableRow className={className} {...props} />
  return (
    <TableRow
      tabIndex={0}
      className={cn("cursor-pointer hover:bg-muted/50", className)}
      onClick={() => navigate(to)}
      onKeyDown={(e) => e.key === "Enter" && navigate(to)}
      {...props}
    />
  )
}

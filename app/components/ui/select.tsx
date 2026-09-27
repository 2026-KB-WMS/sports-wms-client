import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"

/**
 * base-ui의 Select 프리미티브 대신, 네이티브 <select>를 기존 Input과 같은 밑줄 스타일로
 * 감싼 가벼운 버전이다. 옵션 수가 적은 필터·폼 용도로 충분하다.
 */
function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative inline-block w-full">
      <select
        data-slot="select"
        className={cn(
          "h-10 w-full min-w-0 appearance-none border border-transparent border-b-input bg-transparent px-0 py-1 pr-6 text-base text-foreground transition-[color,border-color] outline-none focus-visible:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }

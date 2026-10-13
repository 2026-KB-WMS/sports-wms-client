"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"
import { CheckIcon, ChevronDown } from "lucide-react"

interface OptionData {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

/** `<option>` 자식들에서 값·라벨을 뽑는다. `<optgroup>`은 쓰지 않으므로 한 단계만 본다. */
function readOptions(children: React.ReactNode): OptionData[] {
  const options: OptionData[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== "option") return
    const props = child.props as React.ComponentProps<"option">
    options.push({
      value: String(props.value ?? props.children ?? ""),
      label: props.children,
      disabled: props.disabled,
    })
  })
  return options
}

/**
 * 기존 네이티브 `<select>` 사용처(`<option>` 자식, `onChange(e)` → `e.target.value`)를 그대로 두고
 * 열리는 목록만 사이트 디자인(DropdownMenu와 같은 팝업)으로 그린다.
 * 폼 제출·`multiple`은 지원하지 않는다(현재 사용처 없음).
 */
function Select({
  className,
  children,
  id,
  value,
  defaultValue,
  onChange,
  disabled,
}: Omit<React.ComponentProps<"select">, "multiple">) {
  const options = readOptions(children)
  const items = options.map(({ value, label }) => ({ value, label }))

  return (
    <SelectPrimitive.Root
      items={items}
      value={value === undefined ? undefined : String(value)}
      defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
      disabled={disabled}
      onValueChange={(next) =>
        onChange?.({
          target: { value: next ?? "" },
          currentTarget: { value: next ?? "" },
        } as React.ChangeEvent<HTMLSelectElement>)
      }
    >
      <SelectPrimitive.Trigger
        id={id}
        data-slot="select"
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-2 border border-transparent border-b-input bg-transparent px-0 py-1 text-left text-base text-foreground transition-[color,border-color] outline-none focus-visible:border-b-ring data-popup-open:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
      >
        <SelectPrimitive.Value className="truncate" />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground transition-transform duration-150 data-popup-open:rotate-180">
          <ChevronDown className="size-3.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          className="isolate z-50 outline-none"
          alignItemWithTrigger={false}
          sideOffset={4}
        >
          <SelectPrimitive.Popup className="z-50 max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-none bg-popover p-1.5 text-popover-foreground border border-foreground/20 shadow-md transition-[clip-path,opacity] duration-150 ease-out outline-none [clip-path:inset(-12px)] data-[ending-style]:[clip-path:inset(-12px_-12px_100%_-12px)] data-[ending-style]:opacity-0 data-[starting-style]:[clip-path:inset(-12px_-12px_100%_-12px)] data-[starting-style]:opacity-0 data-[side=top]:data-[ending-style]:[clip-path:inset(100%_-12px_-12px_-12px)] data-[side=top]:data-[starting-style]:[clip-path:inset(100%_-12px_-12px_-12px)] motion-reduce:transition-none">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex cursor-default items-center gap-2.5 rounded-none py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:text-primary"
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
                    <CheckIcon className="size-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { Select }

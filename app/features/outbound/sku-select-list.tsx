export interface SkuOption {
  skuId: number
  label: string
  hint: string
}

/** 전부 선택했으면 undefined(서버의 "전체" 동작), 아니면 선택한 SKU ID. 빈 배열은 서버가 400이라 호출 전에 막는다. */
export function toSkuIds(options: SkuOption[], selected: Set<number>) {
  return selected.size === options.length ? undefined : [...selected]
}

export function SkuSelectList({
  options,
  selected,
  onChange,
}: {
  options: SkuOption[]
  selected: Set<number>
  onChange: (selected: Set<number>) => void
}) {
  function toggle(skuId: number) {
    const next = new Set(selected)
    if (!next.delete(skuId)) next.add(skuId)
    onChange(next)
  }
  return (
    <ul className="max-h-64 divide-y overflow-y-auto rounded-md border text-sm">
      {options.map((o) => (
        <li key={o.skuId}>
          <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
            <input
              type="checkbox"
              checked={selected.has(o.skuId)}
              onChange={() => toggle(o.skuId)}
            />
            <span className="flex-1">{o.label}</span>
            <span className="text-xs text-muted-foreground">{o.hint}</span>
          </label>
        </li>
      ))}
    </ul>
  )
}

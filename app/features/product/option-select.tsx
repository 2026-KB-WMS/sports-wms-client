import { useState } from "react"

import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import type { CategoryOptionType } from "~/lib/api/product"

import { useCategoryOptionGroups } from "./hooks"

/** 옵션 그룹 ID → 고른 옵션 값 ID(문자열). 다른 카테고리의 그룹 값이 남아 있어도 무시된다. */
type Selection = Record<number, string>

/**
 * 카테고리에 지정된 옵션 그룹(상속 포함) 중 `type`인 것마다 값 하나씩 고르는 상태.
 * 지정된 그룹의 값을 모두 골라야 `complete`가 된다(서버는 하나라도 빠지면 400).
 */
export function useOptionSelection(
  categoryId: number | null,
  type: CategoryOptionType
) {
  const query = useCategoryOptionGroups(categoryId)
  const [selection, setSelection] = useState<Selection>({})
  const groups = (query.data?.items ?? []).filter((g) => g.optionType === type)
  const picked = groups.map((g) => selection[g.optionGroupId] ?? "")
  const ids = picked.filter((v) => v !== "").map(Number)
  return {
    groups,
    selection,
    setSelection,
    reset: () => setSelection({}),
    isLoading: query.isLoading,
    ids,
    complete: !query.isLoading && ids.length === groups.length,
    type,
  }
}

type OptionSelection = ReturnType<typeof useOptionSelection>

export function OptionSelects({
  state,
  idPrefix,
}: {
  state: OptionSelection
  idPrefix: string
}) {
  return state.groups.map((group) => (
    <div key={group.optionGroupId}>
      <Label htmlFor={`${idPrefix}-${group.optionGroupId}`}>
        {group.name} *
      </Label>
      <Select
        id={`${idPrefix}-${group.optionGroupId}`}
        value={state.selection[group.optionGroupId] ?? ""}
        onChange={(e) =>
          state.setSelection((s) => ({
            ...s,
            [group.optionGroupId]: e.target.value,
          }))
        }
      >
        <option value="">선택</option>
        {group.values
          // SKU 코드는 옵션 코드로 만들어지므로 코드가 없는 이전 값은 고를 수 없다.
          .filter(
            (v) => v.isActive && (state.type === "SPEC" || v.optionCode != null)
          )
          .map((v) => (
            <option key={v.optionValueId} value={v.optionValueId}>
              {v.optionCode ? `${v.value} (${v.optionCode})` : v.value}
            </option>
          ))}
      </Select>
    </div>
  ))
}

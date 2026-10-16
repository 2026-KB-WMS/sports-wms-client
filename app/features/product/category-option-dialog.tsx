import { useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import { getErrorMessage } from "~/lib/api/error-messages"
import type {
  Category,
  CategoryOptionGroup,
  CategoryOptionGroupInput,
  CategoryOptionType,
} from "~/lib/api/product"

import {
  useCategoryOptionGroups,
  useCreateOptionGroup,
  useCreateOptionValue,
  useOptionGroups,
  useReplaceCategoryOptionGroups,
} from "./hooks"

const TYPE_LABEL: Record<CategoryOptionType, string> = {
  SPEC: "스펙 (상품 단위)",
  SKU: "SKU 옵션 (SKU 단위)",
}

/** category가 있을 때만 폼이 마운트되어 열릴 때마다 서버 값으로 초기화된다. */
export function CategoryOptionDialog({
  category,
  onClose,
}: {
  category: Category | null
  onClose: () => void
}) {
  return (
    <Dialog open={category != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        {category && (
          <CategoryOptionLoader
            key={category.categoryId}
            category={category}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CategoryOptionLoader({
  category,
  onClose,
}: {
  category: Category
  onClose: () => void
}) {
  const query = useCategoryOptionGroups(category.categoryId)
  const groupsQuery = useOptionGroups()
  if (query.isError || groupsQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(
          query.error ?? groupsQuery.error,
          "옵션 그룹을 불러오지 못했습니다."
        )}
      </p>
    )
  }
  if (!query.data || !groupsQuery.data) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }
  return (
    <CategoryOptionForm
      category={category}
      applied={query.data.items}
      allGroups={groupsQuery.data.items}
      onClose={onClose}
    />
  )
}

function CategoryOptionForm({
  category,
  applied,
  allGroups,
  onClose,
}: {
  category: Category
  applied: CategoryOptionGroup[]
  allGroups: { optionGroupId: number; name: string }[]
  onClose: () => void
}) {
  const replace = useReplaceCategoryOptionGroups()
  const inherited = applied.filter((g) => g.inherited)
  const [own, setOwn] = useState<CategoryOptionGroupInput[]>(
    applied
      .filter((g) => !g.inherited)
      .map((g) => ({
        optionGroupId: g.optionGroupId,
        optionType: g.optionType,
        sortOrder: g.sortOrder,
      }))
  )
  const [addId, setAddId] = useState("")
  const nameById = new Map(allGroups.map((g) => [g.optionGroupId, g.name]))
  const addable = allGroups.filter(
    (g) => !own.some((o) => o.optionGroupId === g.optionGroupId)
  )

  function patch(index: number, change: Partial<CategoryOptionGroupInput>) {
    setOwn((items) =>
      items.map((item, i) => (i === index ? { ...item, ...change } : item))
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>옵션 그룹 지정 · {category.categoryName}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        {inherited.length > 0 && (
          <div>
            <p className="text-sm font-medium">상위에서 상속</p>
            <ul className="mt-1 text-sm text-muted-foreground">
              {inherited.map((g) => (
                <li key={g.optionGroupId}>
                  {g.name} · {TYPE_LABEL[g.optionType]}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid gap-2">
          <p className="text-sm font-medium">이 카테고리의 지정</p>
          {own.length === 0 && (
            <p className="text-sm text-muted-foreground">
              지정된 옵션 그룹이 없습니다.
            </p>
          )}
          {own.map((item, index) => (
            <div
              key={item.optionGroupId}
              className="grid grid-cols-[1fr_9rem_4rem_auto] items-center gap-2"
            >
              <span className="truncate text-sm">
                {nameById.get(item.optionGroupId) ?? item.optionGroupId}
              </span>
              <Select
                aria-label="용도"
                value={item.optionType}
                onChange={(e) =>
                  patch(index, {
                    optionType: e.target.value as CategoryOptionType,
                  })
                }
              >
                <option value="SKU">SKU 옵션</option>
                <option value="SPEC">스펙</option>
              </Select>
              <Input
                aria-label="순서"
                type="number"
                min={0}
                value={item.sortOrder ?? 0}
                onChange={(e) =>
                  patch(index, { sortOrder: Number(e.target.value) })
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setOwn((items) => items.filter((_, i) => i !== index))
                }
              >
                제거
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Select
              aria-label="추가할 옵션 그룹"
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
            >
              <option value="">옵션 그룹 선택</option>
              {addable.map((g) => (
                <option key={g.optionGroupId} value={g.optionGroupId}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={addId === ""}
              onClick={() => {
                setOwn((items) => [
                  ...items,
                  {
                    optionGroupId: Number(addId),
                    optionType: "SKU",
                    sortOrder: items.length,
                  },
                ])
                setAddId("")
              }}
            >
              추가
            </Button>
          </div>
        </div>
        <OptionMasterForm groups={allGroups} />
        {replace.isError && (
          <p className="text-sm text-destructive">
            {getErrorMessage(replace.error, "저장에 실패했습니다.")}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={replace.isPending}
        >
          취소
        </Button>
        <Button
          disabled={replace.isPending}
          onClick={() =>
            replace.mutate(
              { categoryId: category.categoryId, items: own },
              { onSuccess: onClose }
            )
          }
        >
          {replace.isPending ? "처리 중..." : "저장"}
        </Button>
      </DialogFooter>
    </>
  )
}

/** 옵션 그룹·값 등록. 값의 코드는 SKU 코드 자동 생성에 쓰이며 등록 뒤 수정할 수 없다. */
function OptionMasterForm({
  groups,
}: {
  groups: { optionGroupId: number; name: string }[]
}) {
  const createGroup = useCreateOptionGroup()
  const createValue = useCreateOptionValue()
  const [groupName, setGroupName] = useState("")
  const [groupId, setGroupId] = useState("")
  const [code, setCode] = useState("")
  const [value, setValue] = useState("")
  const codeValid = /^[A-Za-z0-9]{1,10}$/.test(code)
  const error = createGroup.error ?? createValue.error

  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">
        옵션 그룹·값 새로 만들기
      </summary>
      <div className="mt-3 grid gap-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="option-group-name">새 옵션 그룹</Label>
            <Input
              id="option-group-name"
              placeholder="예: 색상"
              maxLength={100}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={groupName.trim() === "" || createGroup.isPending}
            onClick={() =>
              createGroup.mutate(groupName.trim(), {
                onSuccess: () => setGroupName(""),
              })
            }
          >
            만들기
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="option-value-group">새 옵션 값</Label>
          <Select
            id="option-value-group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">옵션 그룹 선택</option>
            {groups.map((g) => (
              <option key={g.optionGroupId} value={g.optionGroupId}>
                {g.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Input
              aria-label="옵션 코드"
              placeholder="코드 (영문·숫자 1~10자)"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <Input
              aria-label="옵션 값"
              placeholder="값 (예: 검정)"
              maxLength={100}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={
                groupId === "" ||
                !codeValid ||
                value.trim() === "" ||
                createValue.isPending
              }
              onClick={() =>
                createValue.mutate(
                  {
                    optionGroupId: Number(groupId),
                    optionCode: code,
                    value: value.trim(),
                  },
                  {
                    onSuccess: () => {
                      setCode("")
                      setValue("")
                    },
                  }
                )
              }
            >
              추가
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">
            {getErrorMessage(error, "저장에 실패했습니다.")}
          </p>
        )}
      </div>
    </details>
  )
}

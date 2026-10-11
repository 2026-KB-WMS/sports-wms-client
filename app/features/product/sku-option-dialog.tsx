import { useRef, useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { ProductSkuListItem } from "~/lib/api/product"

import {
  useConnectSkuOptions,
  useCreateOptionGroup,
  useCreateOptionValue,
  useOptionGroupsByProduct,
} from "./hooks"

const NEW = "new"

/** sku가 있을 때만 폼이 마운트되어 열릴 때마다 입력값이 초기화된다. */
export function SkuOptionDialog({
  sku,
  onClose,
}: {
  sku: ProductSkuListItem | null
  onClose: () => void
}) {
  return (
    <Dialog open={sku != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {sku && <SkuOptionForm key={sku.skuId} sku={sku} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function SkuOptionForm({
  sku,
  onClose,
}: {
  sku: ProductSkuListItem
  onClose: () => void
}) {
  const groupsQuery = useOptionGroupsByProduct(sku.productId)
  const createGroup = useCreateOptionGroup()
  const createValue = useCreateOptionValue()
  const connect = useConnectSkuOptions()
  const groups = groupsQuery.data?.items ?? []

  const [groupSel, setGroupSel] = useState(NEW)
  const [groupName, setGroupName] = useState("")
  const [valueSel, setValueSel] = useState(NEW)
  const [valueText, setValueText] = useState("")
  const [error, setError] = useState<string | null>(null)
  // 그룹은 만들었는데 값 등록·연결이 실패한 경우, 재시도 때 같은 그룹을 다시 만들지 않는다.
  const created = useRef<{ name: string; groupId: number } | null>(null)

  const group = groups.find((g) => String(g.optionGroupId) === groupSel)
  const isNewGroup = group == null
  const isNewValue = isNewGroup || valueSel === NEW
  const name = groupName.trim()
  const text = valueText.trim()
  const canSubmit = (!isNewGroup || name !== "") && (!isNewValue || text !== "")
  const pending =
    createGroup.isPending || createValue.isPending || connect.isPending

  async function handleSubmit() {
    setError(null)
    try {
      let groupId = group?.optionGroupId
      if (groupId == null) {
        if (created.current?.name === name) {
          groupId = created.current.groupId
        } else {
          groupId = (await createGroup.mutateAsync(name)).optionGroupId
          created.current = { name, groupId }
        }
      }
      const valueId = isNewValue
        ? (
            await createValue.mutateAsync({
              optionGroupId: groupId,
              value: text,
            })
          ).optionValueId
        : Number(valueSel)
      await connect.mutateAsync({ skuId: sku.skuId, optionValueIds: [valueId] })
      onClose()
    } catch (e) {
      setError(getErrorMessage(e, "옵션 연결에 실패했습니다."))
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>옵션 연결 · {sku.skuName}</DialogTitle>
        <DialogDescription>
          옵션 그룹당 값 1개만 연결할 수 있고, 연결한 옵션은 해제할 수 없습니다.
          {sku.optionValues.length > 0 &&
            ` 현재: ${sku.optionValues
              .map((o) => `${o.optionGroupName} ${o.value}`)
              .join(", ")}`}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="option-group">옵션 그룹</Label>
          <Select
            id="option-group"
            value={groupSel}
            onChange={(e) => {
              setGroupSel(e.target.value)
              setValueSel(NEW)
            }}
          >
            <option value={NEW}>새 그룹 만들기</option>
            {groups.map((g) => (
              <option key={g.optionGroupId} value={g.optionGroupId}>
                {g.name}
              </option>
            ))}
          </Select>
          {isNewGroup && (
            <Input
              className="mt-2"
              placeholder="새 그룹명 (예: 사이즈)"
              maxLength={100}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          )}
        </div>
        <div>
          <Label htmlFor="option-value">옵션 값</Label>
          {group && (
            <Select
              id="option-value"
              value={valueSel}
              onChange={(e) => setValueSel(e.target.value)}
            >
              <option value={NEW}>새 값 만들기</option>
              {group.values.map((v) => (
                <option key={v.optionValueId} value={v.optionValueId}>
                  {v.value}
                </option>
              ))}
            </Select>
          )}
          {isNewValue && (
            <Input
              id={group ? undefined : "option-value"}
              className="mt-2"
              placeholder="새 값 (예: 270)"
              maxLength={100}
              value={valueText}
              onChange={(e) => setValueText(e.target.value)}
            />
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={pending}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || pending}>
          {pending ? "처리 중..." : "연결"}
        </Button>
      </DialogFooter>
    </>
  )
}

import { useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { AllocationShortage } from "~/lib/api/outbound"
import type { StoreOrderLine } from "~/lib/api/store-order"

import { useAllocateStoreOrder } from "./hooks"
import { SkuSelectList, toSkuIds } from "./sku-select-list"

/**
 * 지점 발주의 재고를 SKU를 골라 할당한다(FEFO). 재고가 모자란 SKU는 가용 수량만큼만 할당되고,
 * 부족분은 결과 화면에 남겨 보여 준다.
 */
export function AllocateDialog({
  open,
  onOpenChange,
  storeOrderId,
  lines,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeOrderId: number
  lines: StoreOrderLine[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* 열릴 때마다 새로 마운트되어 선택·결과가 초기화된다. */}
        {open && (
          <AllocateForm
            storeOrderId={storeOrderId}
            lines={lines}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AllocateForm({
  storeOrderId,
  lines,
  onOpenChange,
}: {
  storeOrderId: number
  lines: StoreOrderLine[]
  onOpenChange: (open: boolean) => void
}) {
  const allocate = useAllocateStoreOrder()
  const options = lines.map((l) => ({
    skuId: l.skuId,
    label: `${l.skuCode} ${l.skuName}`,
    hint: `요청 ${l.requestedQuantity} · 할당 ${l.allocatedQuantity} · 출고 ${l.shippedQuantity}`,
  }))
  const [selected, setSelected] = useState(
    () => new Set(lines.map((l) => l.skuId))
  )
  const [shortages, setShortages] = useState<AllocationShortage[] | null>(null)
  const nameOf = (skuId: number) => {
    const l = lines.find((x) => x.skuId === skuId)
    return l ? `${l.skuCode} ${l.skuName}` : `SKU #${skuId}`
  }

  if (shortages) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>재고 할당 완료</DialogTitle>
        </DialogHeader>
        {shortages.length > 0 && (
          <ul className="divide-y rounded-md border text-sm">
            {shortages.map((s) => (
              <li
                key={s.skuId}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span>{nameOf(s.skuId)}</span>
                <span className="text-xs text-muted-foreground">
                  요청 {s.requestedQuantity} · 할당 {s.allocatedQuantity} ·{" "}
                  <span className="text-destructive">
                    부족 {s.shortageQuantity}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>확인</Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>재고 할당</DialogTitle>
      </DialogHeader>
      <SkuSelectList
        options={options}
        selected={selected}
        onChange={setSelected}
      />
      {allocate.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(allocate.error, "할당에 실패했습니다.")}
        </p>
      )}
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={allocate.isPending}
        >
          취소
        </Button>
        <Button
          disabled={allocate.isPending || selected.size === 0}
          onClick={() =>
            allocate.mutate(
              { storeOrderId, skuIds: toSkuIds(options, selected) },
              { onSuccess: (r) => setShortages(r.shortages) }
            )
          }
        >
          {allocate.isPending ? "할당 중..." : "할당"}
        </Button>
      </DialogFooter>
    </>
  )
}

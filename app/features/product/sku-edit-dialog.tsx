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
import { getErrorMessage } from "~/lib/api/error-messages"
import type {
  ProductSkuListItem,
  ProductSkuUpdateInput,
} from "~/lib/api/product"

import { useUpdateSku } from "./hooks"

/** sku가 있을 때만 폼이 마운트되어 열릴 때마다 입력값이 초기화된다. */
export function SkuEditDialog({
  sku,
  onClose,
}: {
  sku: ProductSkuListItem | null
  onClose: () => void
}) {
  return (
    <Dialog open={sku != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {sku && <SkuEditForm key={sku.skuId} sku={sku} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function SkuEditForm({
  sku,
  onClose,
}: {
  sku: ProductSkuListItem
  onClose: () => void
}) {
  const update = useUpdateSku()
  const [form, setForm] = useState({
    skuName: sku.skuName,
    barcode: sku.barcode ?? "",
    weight: sku.weight?.toString() ?? "",
    currentPurchasePrice: String(sku.currentPurchasePrice),
    currentSupplyPrice: String(sku.currentSupplyPrice),
    safetyStockQuantity: sku.safetyStockQuantity?.toString() ?? "",
  })

  // 바뀐 필드만 보낸다. 바코드·중량·안전재고는 서버가 비우기를 지원하지 않아 빈 값은 보내지 않는다.
  const body: ProductSkuUpdateInput = {}
  const name = form.skuName.trim()
  if (name !== sku.skuName) body.skuName = name
  if (form.barcode !== "" && form.barcode !== (sku.barcode ?? ""))
    body.barcode = form.barcode
  if (form.weight !== "" && Number(form.weight) !== sku.weight)
    body.weight = Number(form.weight)
  if (Number(form.currentPurchasePrice) !== sku.currentPurchasePrice)
    body.currentPurchasePrice = Number(form.currentPurchasePrice)
  if (Number(form.currentSupplyPrice) !== sku.currentSupplyPrice)
    body.currentSupplyPrice = Number(form.currentSupplyPrice)
  if (
    form.safetyStockQuantity !== "" &&
    Number(form.safetyStockQuantity) !== sku.safetyStockQuantity
  )
    body.safetyStockQuantity = Number(form.safetyStockQuantity)

  const nonNegative = (v: string) => v === "" || Number(v) >= 0
  const valid =
    name !== "" &&
    name.length <= 200 &&
    form.barcode.length <= 100 &&
    form.currentPurchasePrice !== "" &&
    form.currentSupplyPrice !== "" &&
    [
      form.weight,
      form.currentPurchasePrice,
      form.currentSupplyPrice,
      form.safetyStockQuantity,
    ].every(nonNegative) &&
    (form.safetyStockQuantity === "" ||
      Number.isInteger(Number(form.safetyStockQuantity)))
  const changed = Object.keys(body).length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !changed || update.isPending) return
    update.mutate({ skuId: sku.skuId, body }, { onSuccess: onClose })
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>SKU 수정</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        {sku.skuCode} · {sku.productName} · 단위 {sku.unit ?? "-"} ·{" "}
        {sku.isActive ? "사용" : "미사용"}
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-sku-name">SKU명</Label>
        <Input id="edit-sku-name" {...field("skuName")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-sku-barcode">바코드</Label>
          <Input id="edit-sku-barcode" {...field("barcode")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-sku-weight">중량</Label>
          <Input
            id="edit-sku-weight"
            type="number"
            min={0}
            {...field("weight")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-sku-purchase">매입 단가</Label>
          <Input
            id="edit-sku-purchase"
            type="number"
            min={0}
            {...field("currentPurchasePrice")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-sku-supply">공급 단가</Label>
          <Input
            id="edit-sku-supply"
            type="number"
            min={0}
            {...field("currentSupplyPrice")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-sku-safety">안전 재고</Label>
          <Input
            id="edit-sku-safety"
            type="number"
            min={0}
            {...field("safetyStockQuantity")}
          />
        </div>
      </div>
      {update.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(update.error, "SKU 수정에 실패했습니다.")}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" disabled={!valid || !changed || update.isPending}>
          {update.isPending ? "저장 중..." : "저장"}
        </Button>
      </DialogFooter>
    </form>
  )
}

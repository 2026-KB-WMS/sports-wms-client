import { useState } from "react"
import { useQueries } from "@tanstack/react-query"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Select } from "~/components/ui/select"
import { getErrorMessage } from "~/lib/api/error-messages"
import * as productApi from "~/lib/api/product"
import type { PurchaseOrderLine } from "~/lib/api/purchase-order"

import { formatWon } from "./format"
import { useConfirmPurchaseOrder } from "./hooks"

/**
 * 본사 관리자가 창고 발주 요청을 확정한다. 라인마다 공급처를 고르면 공급처별로 발주서가 한 번에 만들어진다.
 * 후보는 SKU에 매핑된 공급처(`GET /products/skus/{skuId}/suppliers`)이고 비활성 공급처는 고를 수 없다.
 */
export function PurchaseOrderConfirmDialog({
  open,
  onOpenChange,
  purchaseOrderId,
  lines,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrderId: number
  lines: PurchaseOrderLine[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {/* 열릴 때마다 새로 마운트되어 선택값이 비워진다. */}
        {open && (
          <ConfirmForm
            purchaseOrderId={purchaseOrderId}
            lines={lines}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ConfirmForm({
  purchaseOrderId,
  lines,
  onOpenChange,
}: {
  purchaseOrderId: number
  lines: PurchaseOrderLine[]
  onOpenChange: (open: boolean) => void
}) {
  const confirm = useConfirmPurchaseOrder()
  const [selected, setSelected] = useState<Record<number, string>>({})

  // 라인의 SKU별 후보. 키는 useSkuSuppliers와 같아 캐시를 공유한다.
  const candidateQueries = useQueries({
    queries: lines.map((line) => ({
      queryKey: ["product", "sku-suppliers", line.skuId],
      queryFn: () => productApi.getSkuSuppliers(line.skuId),
    })),
  })
  const loading = candidateQueries.some((q) => q.isLoading)
  const loadError = candidateQueries.find((q) => q.isError)?.error

  const rows = lines.map((line, i) => {
    const candidates = (candidateQueries[i].data?.items ?? []).filter(
      (c) => c.isActive
    )
    // 이미 배정된 공급처가 있으면 유지하고, 후보가 하나뿐이면 그것을 기본으로 둔다.
    const fallback =
      line.supplierId != null
        ? String(line.supplierId)
        : candidates.length === 1
          ? String(candidates[0].supplierId)
          : ""
    const value = selected[line.purchaseOrderLineId] ?? fallback
    return { line, candidates, value }
  })

  const canSubmit =
    !loading && rows.length > 0 && rows.every((r) => r.value !== "")

  // 공급처별로 만들어질 발주서를 미리 보여 준다. 서버가 이 묶음 그대로 발주서를 만든다.
  const groups = new Map<
    string,
    { name: string; lineCount: number; amount: number }
  >()
  for (const r of rows) {
    if (r.value === "") continue
    const name =
      r.candidates.find((c) => String(c.supplierId) === r.value)
        ?.supplierName ??
      r.line.supplierName ??
      `공급처 #${r.value}`
    const g = groups.get(r.value) ?? { name, lineCount: 0, amount: 0 }
    g.lineCount += 1
    g.amount += r.line.lineAmount
    groups.set(r.value, g)
  }

  function handleSubmit() {
    confirm.mutate(
      {
        purchaseOrderId,
        lines: rows.map((r) => ({
          purchaseOrderLineId: r.line.purchaseOrderLineId,
          supplierId: Number(r.value),
        })),
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>발주 확정</DialogTitle>
        <DialogDescription>
          항목마다 공급처를 지정하면 공급처별로 발주서가 생성됩니다. 확정하면
          항목·수량을 수정할 수 없고, 변경이 필요하면 취소 후 다시 요청해야
          합니다.
        </DialogDescription>
      </DialogHeader>

      {loading && (
        <p className="text-sm text-muted-foreground">
          공급처 후보를 불러오는 중...
        </p>
      )}
      {loadError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(loadError, "공급처 후보를 불러오지 못했습니다.")}
        </p>
      )}

      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
        {rows.map(({ line, candidates, value }) => (
          <div
            key={line.purchaseOrderLineId}
            className="grid items-center gap-2 sm:grid-cols-[1fr_14rem]"
          >
            <div className="text-sm">
              <span className="block font-mono text-xs text-muted-foreground">
                {line.skuCode}
              </span>
              {line.skuName}
              <span className="ml-2 text-xs text-muted-foreground">
                {line.expectedQuantity}개 · {formatWon(line.lineAmount)}
              </span>
            </div>
            <div>
              {candidates.length === 0 && !loading ? (
                <p className="text-xs text-destructive">
                  매핑된 활성 공급처가 없습니다. SKU에 공급처를 먼저 매핑해야
                  합니다.
                </p>
              ) : (
                <Select
                  aria-label={`${line.skuName} 공급처`}
                  value={value}
                  onChange={(e) =>
                    setSelected((prev) => ({
                      ...prev,
                      [line.purchaseOrderLineId]: e.target.value,
                    }))
                  }
                >
                  <option value="">공급처 선택</option>
                  {candidates.map((c) => (
                    <option key={c.supplierId} value={c.supplierId}>
                      {c.supplierName}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
        ))}
      </div>

      {groups.size > 0 && (
        <div className="rounded-md border p-3 text-sm">
          <p className="mb-1 font-medium">
            공급처 발주서 {groups.size}건이 생성됩니다
          </p>
          <ul className="text-muted-foreground">
            {[...groups.entries()].map(([id, g]) => (
              <li key={id}>
                {g.name} · {g.lineCount}개 항목 · {formatWon(g.amount)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirm.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(confirm.error, "확정에 실패했습니다.")}
        </p>
      )}
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={confirm.isPending}
        >
          닫기
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || confirm.isPending}
        >
          {confirm.isPending ? "확정 중..." : "확정"}
        </Button>
      </DialogFooter>
    </>
  )
}

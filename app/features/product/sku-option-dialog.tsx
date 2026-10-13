import { useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { ProductSkuListItem } from "~/lib/api/product"

import { useConnectSkuOptions, useProduct } from "./hooks"
import { OptionSelects, useOptionSelection } from "./option-select"

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

/** 옵션이 없는 기존 SKU에 한 번만 연결한다. 새 SKU는 SKU 등록에서 옵션을 함께 고른다. */
function SkuOptionForm({
  sku,
  onClose,
}: {
  sku: ProductSkuListItem
  onClose: () => void
}) {
  const productQuery = useProduct(sku.productId)
  const option = useOptionSelection(
    productQuery.data?.categoryId ?? null,
    "SKU"
  )
  const connect = useConnectSkuOptions()
  const [error, setError] = useState<string | null>(null)
  const loading = productQuery.isLoading || option.isLoading

  async function handleSubmit() {
    setError(null)
    try {
      await connect.mutateAsync({
        skuId: sku.skuId,
        optionValueIds: option.ids,
      })
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
          옵션이 없는 SKU에 한 번만 연결할 수 있고, 연결한 옵션은 해제할 수
          없습니다. 상품 카테고리에 지정된 SKU 옵션을 모두 골라야 합니다.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        {loading && (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {!loading && option.groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            이 상품의 카테고리에 지정된 SKU 옵션이 없습니다. 카테고리 탭에서
            옵션 그룹을 지정해 주세요.
          </p>
        )}
        <OptionSelects state={option} idPrefix="sku-option" />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={connect.isPending}
        >
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            loading ||
            option.groups.length === 0 ||
            !option.complete ||
            connect.isPending
          }
        >
          {connect.isPending ? "처리 중..." : "연결"}
        </Button>
      </DialogFooter>
    </>
  )
}

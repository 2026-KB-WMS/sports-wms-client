import { useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { getErrorMessage } from "~/lib/api/error-messages"

import { useAllocations, useCreateOutbound } from "./hooks"
import { SkuSelectList, toSkuIds, type SkuOption } from "./sku-select-list"

const NOTE_MAX_LENGTH = 500

/** 지점 발주의 재고 할당을 묶어 출고(READY)를 만든다. 성공하면 출고 상세로 이동한다. */
export function OutboundCreateDialog({
  open,
  onOpenChange,
  storeOrderId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeOrderId: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* 열릴 때마다 새로 마운트되어 입력값이 비워진다. */}
        {open && (
          <CreateForm storeOrderId={storeOrderId} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CreateForm({
  storeOrderId,
  onOpenChange,
}: {
  storeOrderId: number
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const create = useCreateOutbound()
  const [note, setNote] = useState("")

  // 이미 출고에 묶인 할당도 섞여 있을 수 있다(목록에 연결 정보가 없음). 묶을 게 없으면 서버가 409 NO_ALLOCATION.
  const allocations = useAllocations({
    storeOrderId,
    status: "ALLOCATED",
    size: 100,
  })
  const bySku = new Map<number, SkuOption & { quantity: number }>()
  for (const a of allocations.data?.items ?? []) {
    const prev = bySku.get(a.skuId)
    const quantity = (prev?.quantity ?? 0) + a.allocatedQuantity
    bySku.set(a.skuId, {
      skuId: a.skuId,
      label: `${a.skuCode} ${a.skuName}`,
      hint: `할당 ${quantity}`,
      quantity,
    })
  }
  const options = [...bySku.values()]
  // null이면 전부 선택된 상태(할당 목록이 늦게 와도 기본값이 전체가 되도록)
  const [picked, setPicked] = useState<Set<number> | null>(null)
  const selected = picked ?? new Set(options.map((o) => o.skuId))

  return (
    <>
      <DialogHeader>
        <DialogTitle>출고 생성</DialogTitle>
      </DialogHeader>
      {allocations.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {allocations.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(
            allocations.error,
            "재고 할당을 불러오지 못했습니다."
          )}
        </p>
      )}
      {options.length > 0 && (
        <SkuSelectList
          options={options}
          selected={selected}
          onChange={setPicked}
        />
      )}
      {allocations.isSuccess && options.length === 0 && (
        <p className="text-sm text-muted-foreground">
          묶을 재고 할당이 없습니다. 먼저 재고를 할당해 주세요.
        </p>
      )}
      <div>
        <Label htmlFor="outbound-note">비고 (선택)</Label>
        <Textarea
          id="outbound-note"
          value={note}
          maxLength={NOTE_MAX_LENGTH}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {create.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(create.error, "출고 생성에 실패했습니다.")}
        </p>
      )}
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={create.isPending}
        >
          취소
        </Button>
        <Button
          disabled={create.isPending || selected.size === 0}
          onClick={() =>
            create.mutate(
              {
                storeOrderId,
                note: note.trim() || undefined,
                skuIds: toSkuIds(options, selected),
              },
              {
                onSuccess: (outbound) => {
                  onOpenChange(false)
                  navigate(`/outbounds/${outbound.outboundId}`)
                },
              }
            )
          }
        >
          {create.isPending ? "생성 중..." : "출고 생성"}
        </Button>
      </DialogFooter>
    </>
  )
}

import { useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { REASON_MAX_LENGTH } from "~/components/common/reason-dialog"
import { useWarehouses } from "~/features/warehouse/hooks"
import { getErrorMessage } from "~/lib/api/error-messages"

import { useAssignStoreOrder } from "./hooks"

/**
 * 출고 창고를 배정한다.
 * 승인(APPROVED)된 발주는 최초 배정, 이미 배정(ASSIGNED)된 발주는 재배정이며 재배정은 사유가 필수다.
 * 재배정은 재고 할당·출고가 남아 있으면 서버가 거절한다(ORDER_IN_FULFILLMENT).
 */
export function StoreOrderAssignDialog({
  open,
  onOpenChange,
  storeOrderId,
  currentWarehouseId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeOrderId: number
  currentWarehouseId: number | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* 열릴 때마다 새로 마운트되어 입력값이 비워진다. */}
        {open && (
          <AssignForm
            storeOrderId={storeOrderId}
            currentWarehouseId={currentWarehouseId}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AssignForm({
  storeOrderId,
  currentWarehouseId,
  onOpenChange,
}: {
  storeOrderId: number
  currentWarehouseId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const assign = useAssignStoreOrder()
  const isReassign = currentWarehouseId != null
  const warehouses = (
    useWarehouses({ isActive: true }).data?.items ?? []
  ).filter((w) => w.warehouseId !== currentWarehouseId)
  const [warehouseId, setWarehouseId] = useState("")
  const [reason, setReason] = useState("")

  const canSubmit =
    warehouseId !== "" &&
    (!isReassign || reason.trim() !== "") &&
    !assign.isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isReassign ? "출고 창고 변경" : "출고 창고 배정"}
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="assign-warehouse">창고</Label>
          <Select
            id="assign-warehouse"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">선택</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.warehouseName}
              </option>
            ))}
          </Select>
        </div>
        {isReassign && (
          <div>
            <Label htmlFor="assign-reason">변경 사유</Label>
            <Textarea
              id="assign-reason"
              value={reason}
              maxLength={REASON_MAX_LENGTH}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
      </div>
      {assign.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(assign.error, "배정에 실패했습니다.")}
        </p>
      )}
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={assign.isPending}
        >
          취소
        </Button>
        <Button
          disabled={!canSubmit}
          onClick={() =>
            assign.mutate(
              {
                storeOrderId,
                warehouseId: Number(warehouseId),
                reason: isReassign ? reason.trim() : undefined,
              },
              { onSuccess: () => onOpenChange(false) }
            )
          }
        >
          {assign.isPending ? "처리 중..." : isReassign ? "창고 변경" : "배정"}
        </Button>
      </DialogFooter>
    </>
  )
}

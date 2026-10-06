import { useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { getErrorMessage } from "~/lib/api/error-messages"

import { useCreateOutbound } from "./hooks"

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

  return (
    <>
      <DialogHeader>
        <DialogTitle>출고 생성</DialogTitle>
        <DialogDescription>
          아직 출고에 묶이지 않은 재고 할당을 모두 묶어 출고를 만듭니다. 만든
          뒤에는 그 할당을 해제할 수 없습니다.
        </DialogDescription>
      </DialogHeader>
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
          disabled={create.isPending}
          onClick={() =>
            create.mutate(
              { storeOrderId, note: note.trim() || undefined },
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

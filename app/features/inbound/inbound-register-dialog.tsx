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
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { getErrorMessage } from "~/lib/api/error-messages"

import { useCreateInbound } from "./hooks"

const NOTE_MAX_LENGTH = 1000

/** 현재 시각을 datetime-local 형식(YYYY-MM-DDTHH:mm)으로 만든다. 도착 일시는 현재 이전이어야 한다. */
function nowForInput() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 확정된 발주에 대해 입고(도착)를 등록한다. 성공하면 입고 상세로 이동한다. */
export function InboundRegisterDialog({
  open,
  onOpenChange,
  purchaseOrderId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrderId: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* 열릴 때마다 새로 마운트되어 입력값이 비워진다. */}
        {open && (
          <RegisterForm
            purchaseOrderId={purchaseOrderId}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RegisterForm({
  purchaseOrderId,
  onOpenChange,
}: {
  purchaseOrderId: number
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const createInbound = useCreateInbound()
  const [arrivedAt, setArrivedAt] = useState("")
  const [note, setNote] = useState("")

  function handleSubmit() {
    createInbound.mutate(
      {
        purchaseOrderId,
        // 비우면 서버가 요청 시각으로 기록한다.
        arrivedAt: arrivedAt ? `${arrivedAt}:00` : undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: (inbound) => {
          onOpenChange(false)
          navigate(`/inbounds/${inbound.inboundId}`)
        },
      }
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>입고 등록</DialogTitle>
        <DialogDescription>
          물품이 도착했음을 등록합니다. 검수 항목과 재고 반영은 다음 단계에서
          합니다. 같은 발주에는 완료되지 않은 입고를 한 건만 둘 수 있습니다.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="inbound-arrived-at">도착 일시 (선택)</Label>
          <Input
            id="inbound-arrived-at"
            type="datetime-local"
            max={nowForInput()}
            value={arrivedAt}
            onChange={(e) => setArrivedAt(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="inbound-note">비고 (선택)</Label>
          <Textarea
            id="inbound-note"
            value={note}
            maxLength={NOTE_MAX_LENGTH}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      {createInbound.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(createInbound.error, "입고 등록에 실패했습니다.")}
        </p>
      )}
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={createInbound.isPending}
        >
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={createInbound.isPending}>
          {createInbound.isPending ? "등록 중..." : "입고 등록"}
        </Button>
      </DialogFooter>
    </>
  )
}

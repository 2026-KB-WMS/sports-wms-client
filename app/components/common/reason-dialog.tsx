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
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"

/** 서버 `reason` 필드의 최대 길이 (취소·반려·보류·재개·재고 조정 등 공통) */
export const REASON_MAX_LENGTH = 500

interface ReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** 입력란 라벨. 기본 "사유" */
  label?: string
  /** 사유가 필수인 전이인지. 선택 사유(예: 점주의 REQUESTED 취소)는 false */
  required?: boolean
  submitLabel?: string
  destructive?: boolean
  isPending?: boolean
  /** 서버 오류 문구 (getErrorMessage 결과) */
  error?: string | null
  onSubmit: (reason: string) => void
}

/**
 * 사유를 입력받는 모달. 닫을 때마다 입력값은 초기화된다.
 * 호출부는 onSubmit에서 mutation을 실행하고 성공 시 open을 false로 바꾼다.
 */
export function ReasonDialog({ open, ...props }: ReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        {/* 열릴 때마다 새로 마운트되어 입력값이 비워진다. */}
        {open && <ReasonForm {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function ReasonForm({
  onOpenChange,
  title,
  description,
  label = "사유",
  required = true,
  submitLabel = "확인",
  destructive = false,
  isPending = false,
  error,
  onSubmit,
}: Omit<ReasonDialogProps, "open">) {
  const [reason, setReason] = useState("")
  const trimmed = reason.trim()
  const canSubmit = (!required || trimmed !== "") && !isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div>
        <Label htmlFor="reason-dialog-input">
          {label}
          {!required && " (선택)"}
        </Label>
        <Textarea
          id="reason-dialog-input"
          value={reason}
          maxLength={REASON_MAX_LENGTH}
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {reason.length} / {REASON_MAX_LENGTH}
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          취소
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          disabled={!canSubmit}
          onClick={() => onSubmit(trimmed)}
        >
          {isPending ? "처리 중..." : submitLabel}
        </Button>
      </DialogFooter>
    </>
  )
}

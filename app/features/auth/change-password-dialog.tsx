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

import { useChangePassword } from "./hooks"
import { getPasswordError } from "./password-rules"

/** 열릴 때마다 새로 마운트되어 입력값과 오류가 초기화된다. */
export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <ChangePasswordForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const change = useChangePassword()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")

  const nextError = next !== "" ? getPasswordError(next) : null
  const sameAsCurrent = next !== "" && next === current
  const mismatch = confirm !== "" && confirm !== next
  const canSubmit =
    current !== "" &&
    getPasswordError(next) === null &&
    !sameAsCurrent &&
    next === confirm

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || change.isPending) return
    change.mutate({ currentPassword: current, newPassword: next })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>비밀번호 변경</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">현재 비밀번호</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        {(nextError || sameAsCurrent) && (
          <p className="text-xs text-destructive">
            {nextError ?? "현재 비밀번호와 다른 비밀번호를 입력해 주세요."}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {mismatch && (
          <p className="text-xs text-destructive">
            비밀번호가 일치하지 않습니다.
          </p>
        )}
      </div>
      {/* 현재 비밀번호 불일치는 400이라 로그아웃되지 않고 여기에 표시된다. */}
      {change.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(change.error, "비밀번호 변경에 실패했습니다.")}
        </p>
      )}
      {change.isSuccess && (
        <p role="status" className="text-sm">
          비밀번호가 변경되었습니다.
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {change.isSuccess ? "닫기" : "취소"}
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit || change.isPending || change.isSuccess}
        >
          {change.isPending ? "변경 중..." : "변경"}
        </Button>
      </DialogFooter>
    </form>
  )
}

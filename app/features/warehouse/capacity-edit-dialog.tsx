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

/** 창고·구역 수용량만 수정한다. target이 있을 때만 폼이 마운트되어 열릴 때마다 초기화된다. */
export function CapacityEditDialog({
  target,
  onClose,
  onSave,
  isPending,
  error,
}: {
  target: { title: string; current: number | null } | null
  onClose: () => void
  onSave: (capacity: number, onSuccess: () => void) => void
  isPending: boolean
  error: unknown
}) {
  return (
    <Dialog open={target != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {target && (
          <CapacityForm
            target={target}
            onClose={onClose}
            onSave={onSave}
            isPending={isPending}
            error={error}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CapacityForm({
  target,
  onClose,
  onSave,
  isPending,
  error,
}: {
  target: { title: string; current: number | null }
  onClose: () => void
  onSave: (capacity: number, onSuccess: () => void) => void
  isPending: boolean
  error: unknown
}) {
  const [value, setValue] = useState(target.current?.toString() ?? "")
  const valid = value !== "" && Number(value) >= 0
  const changed = Number(value) !== target.current

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !changed || isPending) return
    onSave(Number(value), onClose)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{target.title}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-capacity">수용량</Label>
        <Input
          id="edit-capacity"
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      {error != null && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(error, "수용량 수정에 실패했습니다.")}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" disabled={!valid || !changed || isPending}>
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </DialogFooter>
    </form>
  )
}

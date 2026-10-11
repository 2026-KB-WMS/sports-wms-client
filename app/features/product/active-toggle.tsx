import { useState } from "react"

import { ConfirmDialog } from "~/components/common/confirm-dialog"
import { Button } from "~/components/ui/button"
import { getErrorMessage } from "~/lib/api/error-messages"

/**
 * 상품·SKU 목록 행의 비활성화/재활성화 버튼과 확인 다이얼로그.
 * 호출부가 mutation을 넘기고, 이 컴포넌트는 열림 상태와 문구만 다룬다.
 */
export function ActiveToggle({
  kind,
  name,
  isActive,
  deactivateHint,
  activateHint,
  isPending,
  error,
  reset,
  run,
}: {
  kind: "상품" | "SKU"
  name: string
  isActive: boolean
  deactivateHint: string
  activateHint: string
  isPending: boolean
  error: unknown
  reset: () => void
  run: (next: boolean, onSuccess: () => void) => void
}) {
  const [open, setOpen] = useState(false)
  const label = isActive ? "비활성화" : "재활성화"

  return (
    <>
      <Button
        variant={isActive ? "destructive" : "outline"}
        size="sm"
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${kind} ${label}`}
        description={`${name} — ${isActive ? deactivateHint : activateHint}`}
        confirmLabel={label}
        destructive={isActive}
        isPending={isPending}
        error={
          error ? getErrorMessage(error, `${label}에 실패했습니다.`) : null
        }
        onConfirm={() => run(!isActive, () => setOpen(false))}
      />
    </>
  )
}

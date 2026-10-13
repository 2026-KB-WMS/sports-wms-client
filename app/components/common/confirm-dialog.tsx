import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  /** 비활성화·삭제처럼 되돌릴 수 없는 작업이면 true */
  destructive?: boolean
  isPending?: boolean
  /** 서버 오류 문구 (getErrorMessage 결과) */
  error?: string | null
  /** 확인 전에 받을 추가 입력(선택 등) */
  children?: React.ReactNode
  /** 필수 입력이 비어 있을 때 확인을 막는다 */
  confirmDisabled?: boolean
  onConfirm: () => void
}

/** 되돌리기 어려운 작업(비활성화, 상태 전이 등) 전에 확인을 받는 다이얼로그. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  destructive = false,
  isPending = false,
  error,
  children,
  confirmDisabled = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
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
            onClick={onConfirm}
            disabled={isPending || confirmDisabled}
          >
            {isPending ? "처리 중..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

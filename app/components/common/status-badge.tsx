import type { VariantProps } from "class-variance-authority"

import { Badge, type badgeVariants } from "~/components/ui/badge"

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

interface StatusStyle {
  label: string
  variant: BadgeVariant
}

/**
 * 도메인별 상태 코드의 표시 문구. 상태 코드의 기준은 wms-server `docs/api/*.md`·`docs/domain/*.md`.
 * 진행 중은 default, 대기·보조는 secondary, 완료는 outline, 취소·반려는 destructive로 통일한다.
 */
const STATUS_STYLES: Record<string, StatusStyle> = {
  // 마스터(지점·창고·구역·공급처·SKU·상품)
  ACTIVE: { label: "활성", variant: "default" },
  INACTIVE: { label: "비활성", variant: "secondary" },

  // 창고 발주 / 입고 / 지점 발주 / 출고 공통 코드
  REQUESTED: { label: "요청됨", variant: "secondary" },
  CONFIRMED: { label: "확정", variant: "default" },
  APPROVED: { label: "승인", variant: "default" },
  ASSIGNED: { label: "창고 배정", variant: "default" },
  ON_HOLD: { label: "보류", variant: "secondary" },
  COMPLETED: { label: "완료", variant: "outline" },
  CANCELED: { label: "취소됨", variant: "destructive" },
  REJECTED: { label: "반려됨", variant: "destructive" },

  // 입고
  ARRIVED: { label: "도착", variant: "secondary" },
  INSPECTING: { label: "검수 중", variant: "default" },

  // 발주 항목
  PARTIALLY_RECEIVED: { label: "일부 입고", variant: "default" },
  PARTIALLY_SHIPPED: { label: "일부 출고", variant: "default" },

  // 출고
  READY: { label: "출고 준비", variant: "secondary" },
  PICKING: { label: "피킹 중", variant: "default" },
  PICKED: { label: "피킹 완료", variant: "default" },
  SHIPPED: { label: "배송 중", variant: "default" },
  DELIVERED: { label: "배송 완료", variant: "outline" },

  // 재고 할당
  ALLOCATED: { label: "할당됨", variant: "default" },
  RELEASED: { label: "해제됨", variant: "secondary" },

  // 재고 품질·로트 상태
  AVAILABLE: { label: "가용", variant: "default" },
  DEFECTIVE: { label: "불량", variant: "destructive" },
  EXPIRED: { label: "만료", variant: "destructive" },
  QUARANTINED: { label: "격리", variant: "secondary" },
  DISPOSED: { label: "폐기", variant: "destructive" },
}

/**
 * 지점 발주의 점주용 진행 단계 `progressStage` (docs/api/store-order.md 공통 정의 표).
 * 서버가 파생해 내려주는 값이라 발주 상태와 별도 코드 체계다.
 */
const PROGRESS_STAGE_STYLES: Record<string, StatusStyle> = {
  PENDING_APPROVAL: { label: "승인 대기", variant: "secondary" },
  REJECTED: { label: "반려됨", variant: "destructive" },
  CANCELED: { label: "취소됨", variant: "destructive" },
  AWAITING_ASSIGNMENT: { label: "승인됨 (창고 배정 중)", variant: "default" },
  PREPARING: { label: "상품 준비 중", variant: "default" },
  IN_TRANSIT: { label: "배송 중", variant: "default" },
  PARTIALLY_DELIVERED: {
    label: "일부 배송 완료 (남은 수량 준비 중)",
    variant: "default",
  },
  ON_HOLD: { label: "재고 확보 중", variant: "secondary" },
  COMPLETED: { label: "배송 완료", variant: "outline" },
  COMPLETED_PARTIAL: {
    label: "일부 수량만 배송 완료",
    variant: "outline",
  },
}

interface StatusBadgeProps {
  /** 서버 상태 코드. null·undefined면 아무것도 그리지 않는다. */
  status: string | null | undefined
  /** "progress"는 지점 발주의 `progressStage` 값에 쓴다. */
  kind?: "status" | "progress"
  className?: string
}

/** 서버 상태 코드를 한글 문구와 일관된 색으로 보여준다. 모르는 코드는 코드 그대로 표시한다. */
export function StatusBadge({
  status,
  kind = "status",
  className,
}: StatusBadgeProps) {
  if (!status) return null
  const styles = kind === "progress" ? PROGRESS_STAGE_STYLES : STATUS_STYLES
  const style = styles[status] ?? { label: status, variant: "secondary" }
  return (
    <Badge variant={style.variant} className={className}>
      {style.label}
    </Badge>
  )
}

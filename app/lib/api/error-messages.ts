import { ApiError } from "./client"

/**
 * errorCode → 사용자 안내문구.
 * 서버 메시지만으로 다음 행동이 분명하지 않은 코드를 적는다
 * (코드 목록의 기준은 wms-server docs/api/*.md). 여기에 없는 코드는 서버 메시지를 그대로 보여준다.
 * `withServerMessage`가 true면 서버 메시지(예: SKU별 요청·가용 수량)를 괄호로 덧붙인다.
 */
interface ErrorGuide {
  message: string
  withServerMessage?: boolean
}

const ERROR_GUIDES: Record<string, ErrorGuide> = {
  // 공통
  UNAUTHORIZED: { message: "로그인이 필요하거나 인증이 만료되었습니다." },
  FORBIDDEN: { message: "이 작업을 수행할 권한이 없습니다." },
  CONFLICT: {
    message:
      "현재 상태에서는 처리할 수 없습니다. 최신 상태를 다시 불러온 뒤 시도해 주세요.",
  },
  INTERNAL_ERROR: {
    message: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  },

  // 재고
  STALE_QUANTITY: {
    message:
      "그 사이에 재고 수량이 바뀌었습니다. 최신 수량을 다시 불러온 뒤 조정해 주세요.",
  },
  BELOW_ALLOCATED_QUANTITY: {
    message: "조정 후 수량이 이미 할당된 수량보다 적을 수 없습니다.",
  },
  LOT_NOT_AVAILABLE: { message: "사용할 수 없는 상태의 로트입니다." },
  SKU_NOT_ACTIVE: { message: "비활성 SKU는 처리할 수 없습니다." },
  INSUFFICIENT_STOCK: {
    message: "가용 재고가 부족해 할당할 수 없습니다.",
    withServerMessage: true,
  },

  // 창고·구역
  SECTION_CAPACITY_EXCEEDED: {
    message: "구역 수용량을 초과합니다. 다른 구역을 선택해 주세요.",
  },
  SECTION_INACTIVE: { message: "비활성 구역에는 적치할 수 없습니다." },
  WAREHOUSE_INACTIVE: { message: "비활성 창고는 처리할 수 없습니다." },
  CAPACITY_BELOW_USAGE: {
    message: "수용량은 현재 사용량보다 작게 설정할 수 없습니다.",
  },
  SECTION_HAS_INVENTORY: {
    message: "재고가 남아 있는 구역은 비활성화할 수 없습니다.",
  },
  SECTION_HAS_CHILDREN: {
    message: "활성 하위 구역이 있어 비활성화할 수 없습니다.",
  },
  WAREHOUSE_IN_USE: {
    message:
      "재고 또는 진행 중인 입고·출고·발주가 있어 비활성화할 수 없습니다.",
  },
  ALREADY_ASSIGNED: { message: "이미 배정되어 있습니다." },

  // 지점·공급처
  STORE_IN_USE: {
    message: "진행 중인 지점 발주가 있어 비활성화할 수 없습니다.",
  },
  SUPPLIER_IN_USE: {
    message: "진행 중인 발주가 있어 비활성화할 수 없습니다.",
  },
  SUPPLIER_INACTIVE: { message: "비활성 공급처의 발주는 확정할 수 없습니다." },

  // 창고 발주·입고
  PURCHASE_PRICE_MISSING: {
    message: "매입 단가가 없는 SKU는 발주할 수 없습니다.",
  },
  PURCHASE_ORDER_HAS_INBOUND: {
    message: "진행 중이거나 완료된 입고가 있어 발주를 취소할 수 없습니다.",
  },
  INBOUND_IN_PROGRESS: {
    message: "같은 발주에 진행 중인 입고가 있습니다. 먼저 완료하거나 취소해 주세요.",
  },
  INBOUND_HAS_NO_LINES: {
    message: "검수 항목이 없습니다. 검수를 저장한 뒤 완료해 주세요.",
  },
  SECTION_NOT_ASSIGNED: {
    message: "합격·불량 수량이 있는 항목은 적치 구역을 지정해야 합니다.",
  },
  LOT_UNIT_COST_MISMATCH: {
    message: "기존 로트의 원가와 입고 단가가 다릅니다.",
  },
  LOT_DATE_MISMATCH: {
    message: "기존 로트의 제조일·유통기한과 다릅니다.",
  },

  // 지점 발주
  SUPPLY_PRICE_MISSING: {
    message: "공급 단가가 없는 SKU는 처리할 수 없습니다.",
  },
  ORDER_IN_PICKING: {
    message: "피킹이 시작된 출고가 있어 처리할 수 없습니다.",
  },
  ORDER_IN_FULFILLMENT: {
    message: "재고 할당 또는 출고가 진행 중이라 처리할 수 없습니다.",
  },
  OUTBOUND_IN_PROGRESS: {
    message: "진행 중인 출고가 있어 처리할 수 없습니다.",
  },
  NO_SHORTAGE: { message: "부족 수량이 없어 부분 출고로 종결할 수 없습니다." },

  // 출고·할당
  ALREADY_ALLOCATED: { message: "할당할 잔여 수량이 없습니다." },
  ALLOCATION_IN_OUTBOUND: {
    message: "출고에 연결된 할당은 해제할 수 없습니다. 출고를 먼저 취소해 주세요.",
  },
  NO_ALLOCATION: { message: "출고로 묶을 재고 할당이 없습니다." },
  NOTHING_PICKED: { message: "피킹된 수량이 하나도 없습니다." },
  ORDER_NOT_ASSIGNED: {
    message: "발주가 보류·취소 상태라 진행할 수 없습니다.",
  },
  ALLOCATION_NOT_ACTIVE: {
    message: "출고 항목의 재고 할당이 유효하지 않습니다.",
  },
}

/** 필드별 검증 오류를 한 줄로 요약한다. (예: "quantity: 1 이상이어야 합니다")  */
function summarizeFieldErrors(error: ApiError) {
  return error.fieldErrors
    .slice(0, 3)
    .map((e) => `${e.field}: ${e.reason}`)
    .join(", ")
}

/**
 * 화면에 보여줄 오류 문구를 만든다.
 * ApiError가 아니면(예: 코드 버그) 호출부가 넘긴 fallback을 쓴다.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback

  if (error.isNetworkError) {
    return "서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요."
  }

  if (error.errorCode === "VALIDATION_ERROR") {
    const fields = summarizeFieldErrors(error)
    return fields ? `${error.message} (${fields})` : error.message
  }

  const guide = error.errorCode ? ERROR_GUIDES[error.errorCode] : undefined
  if (!guide) return error.message || fallback

  return guide.withServerMessage && error.message
    ? `${guide.message} (${error.message})`
    : guide.message
}

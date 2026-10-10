import { ApiError } from "./client"

/**
 * errorCode → 클라이언트 안내문구.
 * 서버는 코드마다 한국어 기본 메시지(`message`)를 내려주므로(wms-server `*ErrorCode` enum),
 * 여기에는 서버 메시지만으로 부족한 코드만 적는다. 여기에 없는 코드는 서버 메시지를 그대로 보여준다.
 */
const ERROR_GUIDES: Record<string, string> = {
  // 공통: 서버 기본 메시지가 사용자 행동을 안내하지 않는다
  UNAUTHORIZED: "로그인이 필요하거나 인증이 만료되었습니다.",
  FORBIDDEN: "이 작업을 수행할 권한이 없습니다.",
  CONFLICT:
    "현재 상태에서는 처리할 수 없습니다. 최신 상태를 다시 불러온 뒤 시도해 주세요.",
  INTERNAL_ERROR: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",

  // 서버 메시지에 다음 행동이 없다
  SECTION_CAPACITY_EXCEEDED:
    "구역 수용량을 초과합니다. 다른 구역을 선택해 주세요.",
  PARENT_CAPACITY_EXCEEDED:
    "상위 구역(또는 창고)의 수용량을 초과합니다. 수용량을 줄이거나 상위 수용량을 먼저 늘려 주세요.",
  CAPACITY_BELOW_CHILDREN:
    "활성 하위 구역 수용량의 합보다 작게 줄일 수 없습니다. 하위 구역 수용량을 먼저 줄여 주세요.",
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
  return guide ?? (error.message || fallback)
}

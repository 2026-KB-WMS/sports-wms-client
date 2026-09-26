/**
 * 백엔드 공통 응답 포맷 (wms-server의 ApiResponse / ErrorResponse).
 * JSON 필드명은 모두 camelCase다.
 */

/** 성공 응답 봉투 */
export interface ApiResponse<T> {
  success: true
  statusCode: number
  message: string
  data: T
}

/** 검증 실패 시 필드별 사유 */
export interface FieldError {
  field: string
  reason: string
}

/** 실패 응답 봉투 */
export interface ErrorResponse {
  success: false
  statusCode: number
  message: string
  errorCode: string
  errors: FieldError[]
}

/** 목록 API의 data 형태. 페이징 도입 전까지는 items만 내려온다. */
export interface ListData<T> {
  items: T[]
}

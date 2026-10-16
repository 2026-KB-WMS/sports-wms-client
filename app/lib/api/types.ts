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

/** 목록 API의 data 형태. 페이지네이션을 적용한 목록만 pageInfo가 함께 내려온다. */
export interface ListData<T> {
  items: T[]
}

/** 페이지네이션 요청 파라미터. sort는 `필드,asc|desc` 하나만. 생략하면 서버 기본 정렬. */
export type PageParams = {
  page?: number
  size?: number
  sort?: string
}

export interface PageInfo {
  page: number
  size: number
  totalElements: number
  totalPages: number
  /** 실제 적용된 정렬. 요청에 sort가 없으면 기본 정렬이 내려온다. */
  sort: string
}

export interface PagedData<T> extends ListData<T> {
  pageInfo: PageInfo
}

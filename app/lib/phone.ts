/** 서버 `@PhoneNumber`와 같은 형식: 지역번호(2~3자리)-국번(3~4자리)-4자리. 대표번호(1588-…)는 받지 않는다. */
const PHONE_PATTERN = /^\d{2,3}-\d{3,4}-\d{4}$/

export const PHONE_FORMAT_HINT = "예: 010-1234-5678, 02-123-4567"

/** 비어 있으면 null(필수 여부는 호출한 쪽이 판단한다). 값이 있는데 형식이 틀리면 안내 문구. */
export function getPhoneError(value: string) {
  const v = value.trim()
  return v === "" || PHONE_PATTERN.test(v)
    ? null
    : `전화번호 형식이 올바르지 않습니다. ${PHONE_FORMAT_HINT}`
}

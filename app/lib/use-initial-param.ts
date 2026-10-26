import { useSearchParams } from "react-router"

/**
 * 대시보드 등에서 `?status=REQUESTED`처럼 넘긴 값을 목록 화면 필터의 초기값으로 읽는다.
 * 허용 목록에 없는 값은 무시해 빈 문자열(전체)로 둔다. 목록을 생략하면 값 검증 없이 그대로 읽는다(창고 ID처럼 화면이 뜬 뒤 정해지는 값). 마운트 때 한 번만 쓰도록 `useState` 초기값에 넘긴다.
 */
export function useInitialParam(key: string, allowed?: readonly string[]) {
  const [searchParams] = useSearchParams()
  const value = searchParams.get(key)
  return value && (!allowed || allowed.includes(value)) ? value : ""
}

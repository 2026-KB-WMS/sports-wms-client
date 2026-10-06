import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

/**
 * 현재 사용자 모듈.
 *
 * wms-server에 인증(JWT)·회원 도메인이 아직 없어서, 처리 사용자를 `userId` 쿼리로 받는
 * API(재고 조정, 입고 검수·완료, 지점 발주·출고 상태 전이, /warehouses/my, /stores/my 등)에
 * 넘길 값을 이곳에서 한 번에 공급한다. 지금은 사이드바의 임시 전환기로 값을 정하고,
 * JWT가 도입되면 이 모듈의 값 출처만 로그인 사용자로 교체한다(사용하는 쪽은 바뀌지 않는다).
 */

/** 서버 역할 코드 (wms-server docs/api/conventions.md "권한 검증 공통 규칙") */
export type Role = "HQ_ADMIN" | "WAREHOUSE_MANAGER" | "STORE_OWNER"

export const ROLES: { value: Role; label: string }[] = [
  { value: "HQ_ADMIN", label: "본사 관리자" },
  { value: "WAREHOUSE_MANAGER", label: "창고 관리자" },
  { value: "STORE_OWNER", label: "점주" },
]

export function getRoleLabel(role: Role) {
  return ROLES.find((r) => r.value === role)?.label ?? role
}

export interface CurrentUser {
  userId: number
  role: Role
}

interface CurrentUserContextValue extends CurrentUser {
  setUser: (user: CurrentUser) => void
}

const STORAGE_KEY = "wms.current-user"
const DEFAULT_USER: CurrentUser = { userId: 1, role: "HQ_ADMIN" }

function isRole(value: unknown): value is Role {
  return ROLES.some((r) => r.value === value)
}

function isValidUserId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
}

/** 저장된 값을 읽는다. 저장소를 못 쓰거나 값이 이상하면 null (화면은 기본값으로 동작). */
function readStoredUser(): CurrentUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CurrentUser> | null
    if (isRole(parsed?.role) && isValidUserId(parsed?.userId)) {
      return { userId: parsed.userId, role: parsed.role }
    }
  } catch {
    // 저장소 접근 불가·JSON 오류는 무시한다.
  }
  return null
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // SSR과 첫 렌더가 같도록 기본값으로 시작하고, 마운트 후 저장된 값을 반영한다.
  const [user, setUserState] = useState<CurrentUser>(DEFAULT_USER)

  useEffect(() => {
    const stored = readStoredUser()
    if (stored) setUserState(stored)
  }, [])

  const setUser = useCallback((next: CurrentUser) => {
    setUserState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 저장 실패해도 현재 세션에서는 그대로 동작한다.
    }
  }, [])

  const value = useMemo(() => ({ ...user, setUser }), [user, setUser])

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const value = useContext(CurrentUserContext)
  if (!value) {
    throw new Error("useCurrentUser는 CurrentUserProvider 안에서만 쓸 수 있습니다.")
  }
  return value
}

import { useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import * as authApi from "~/lib/api/auth"
import {
  UNAUTHORIZED_EVENT,
  clearToken,
  getToken,
  setToken,
} from "~/lib/auth-token"

/**
 * 현재 사용자 모듈. 로그인 토큰과 `GET /auth/me`로 사용자를 정한다.
 * 보호된 화면은 `AuthGate`가 로그인된 경우에만 렌더하므로 `useCurrentUser()`는 항상 사용자를 돌려준다.
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
  loginId: string
  name: string
  role: Role
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  status: AuthStatus
  user: CurrentUser | null
  login: (input: authApi.LoginInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toCurrentUser(user: CurrentUser): CurrentUser {
  const { userId, loginId, name, role } = user
  return { userId, loginId, name, role }
}

export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = useQueryClient()
  // SSR과 첫 렌더가 같도록 loading으로 시작하고, 마운트 후 토큰을 확인한다.
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<CurrentUser | null>(null)

  const signOut = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus("unauthenticated")
    // 이전 사용자의 캐시가 다음 사용자에게 보이지 않게 한다.
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    if (!getToken()) {
      setStatus("unauthenticated")
      return
    }
    let cancelled = false
    authApi
      .getMe()
      .then((me) => {
        if (cancelled) return
        setUser(toCurrentUser(me))
        setStatus("authenticated")
      })
      .catch(() => {
        // 401이면 client가 이미 토큰을 지웠다. 네트워크 오류 등은 토큰을 남기고 로그인 화면으로 보낸다.
        if (cancelled) return
        setUser(null)
        setStatus("unauthenticated")
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 요청 중 토큰이 거절(401)되면 로그아웃 상태로 바꾼다.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, signOut)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, signOut)
  }, [signOut])

  const login = useCallback(
    async (input: authApi.LoginInput) => {
      const result = await authApi.login(input)
      setToken(result.accessToken)
      queryClient.clear()
      setUser(toCurrentUser(result.user))
      setStatus("authenticated")
    },
    [queryClient]
  )

  const value = useMemo(
    () => ({ status, user, login, logout: signOut }),
    [status, user, login, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error("useAuth는 CurrentUserProvider 안에서만 쓸 수 있습니다.")
  }
  return value
}

/** 로그인된 사용자. `AuthGate` 안(보호된 화면)에서만 쓴다. */
export function useCurrentUser() {
  const { user, logout } = useAuth()
  if (!user) {
    throw new Error("로그인된 사용자가 없습니다. AuthGate 안에서만 쓸 수 있습니다.")
  }
  return { ...user, logout }
}

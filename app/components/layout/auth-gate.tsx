import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router"

import { useAuth } from "~/lib/current-user"

/** 로그인 없이 볼 수 있는 경로 */
const PUBLIC_PATHS = ["/login", "/signup"]

/** 로그인 후 돌아갈 경로. 같은 사이트 안의 경로만 허용한다(open redirect 방지). */
export function safeRedirectTo(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/"
}

/**
 * 보호된 화면을 로그인한 사용자에게만 보여 준다.
 * 미인증이면 `/login?redirectTo=현재경로`로, 로그인 상태로 `/login`에 오면 `redirectTo`(없으면 홈)로 보낸다.
 */
export function AuthGate() {
  const { status, loggedOut } = useAuth()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const isPublic = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      const redirectTo =
        loggedOut || pathname === "/"
          ? ""
          : `?redirectTo=${encodeURIComponent(pathname + search)}`
      navigate(`/login${redirectTo}`, { replace: true })
    } else if (status === "authenticated" && isPublic) {
      navigate(safeRedirectTo(new URLSearchParams(search).get("redirectTo")), {
        replace: true,
      })
    }
  }, [status, loggedOut, isPublic, pathname, search, navigate])

  if (status === "loading") return null
  if (isPublic ? status === "authenticated" : status !== "authenticated")
    return null
  return <Outlet />
}

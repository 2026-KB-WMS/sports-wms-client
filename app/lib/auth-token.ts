/**
 * 액세스 토큰 저장소. 토큰 읽기·쓰기·삭제와 만료(401) 알림을 이 파일에서만 다룬다.
 * 리프레시 토큰을 도입하면 이 모듈과 client.ts의 401 처리만 바꾸면 된다.
 */

const TOKEN_KEY = "wms.access-token"

/** 토큰이 무효가 됐음을 알리는 이벤트. 현재 사용자 모듈이 받아 로그아웃 상태로 바꾼다. */
export const UNAUTHORIZED_EVENT = "wms:unauthorized"

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    // SSR이거나 저장소를 쓸 수 없으면 비로그인으로 취급한다.
    return null
  }
}

export function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // 저장 실패해도 새로고침 전까지는 메모리 상태로 동작한다.
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 무시
  }
}

/** 서버가 토큰을 거절(401)했을 때: 토큰을 지우고 구독자에게 알린다. */
export function handleUnauthorized() {
  clearToken()
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }
}

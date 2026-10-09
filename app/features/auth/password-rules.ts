/** 서버 규칙(wms-server docs/api/auth.md): 8자 이상, 영문·숫자·특수문자 각 1자 이상, UTF-8 72바이트 이하 */
export function getPasswordError(password: string): string | null {
  if (password.length < 8) return "8자 이상 입력해 주세요."
  if (new TextEncoder().encode(password).length > 72) {
    return "72바이트(영문 기준 72자) 이하로 입력해 주세요."
  }
  if (
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z\d]/.test(password)
  ) {
    return "영문, 숫자, 특수문자를 각각 1자 이상 포함해 주세요."
  }
  return null
}

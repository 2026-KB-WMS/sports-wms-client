/** 금액을 "1,234,000원" 형태로 표시한다. */
export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`
}

/** 서버의 오프셋 없는 KST 시각(2026-10-05T14:30:00)을 "2026-10-05 14:30"으로 표시한다. */
export function formatDateTime(value: string | null) {
  if (!value) return "-"
  return value.slice(0, 16).replace("T", " ")
}

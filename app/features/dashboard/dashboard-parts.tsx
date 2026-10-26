import { Link } from "react-router"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { getErrorMessage } from "~/lib/api/error-messages"
import { cn } from "~/lib/utils"

/** 대시보드 공통 조각: 수치 카드, 섹션 제목, 로딩·에러 문구. */

export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR")
}

export function formatRate(rate: number | null) {
  return rate == null ? "-" : `${Math.round(rate * 100)}%`
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>
}

interface StatCardProps {
  label: string
  value: string
  hint?: string
  /** 지정하면 카드 전체가 해당 화면으로 가는 링크가 된다. */
  to?: string
  /** 조치가 필요한 값(0보다 큰 대기 건수 등)을 강조한다. */
  highlight?: boolean
}

export function StatCard({ label, value, hint, to, highlight }: StatCardProps) {
  const card = (
    <Card
      className={cn("h-full", to && "transition-colors hover:bg-accent/50")}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-bold", highlight && "text-primary")}>
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
  return to ? (
    <Link to={to} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  )
}

export function QueryNotice({
  isLoading,
  isError,
  error,
}: {
  isLoading: boolean
  isError: boolean
  error: unknown
}) {
  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        불러오는 중...
      </p>
    )
  }
  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        {getErrorMessage(error, "대시보드를 불러오지 못했습니다.")}
      </p>
    )
  }
  return null
}

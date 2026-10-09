import { Box } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { ApiError } from "~/lib/api/client"
import { getErrorMessage } from "~/lib/api/error-messages"
import { useAuth } from "~/lib/current-user"

/** 로그인 성공 시 상태가 바뀌어 AuthGate가 redirectTo(없으면 홈)로 이동시킨다. */
export function LoginPage() {
  const { login } = useAuth()
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = loginId.trim() !== "" && password !== ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await login({ loginId: loginId.trim(), password })
    } catch (err) {
      // 승인 대기·비활성 계정(403)은 서버 메시지가 안내문구다.
      setError(
        err instanceof ApiError && err.statusCode === 401
          ? "아이디 또는 비밀번호가 올바르지 않습니다."
          : getErrorMessage(err, "로그인에 실패했습니다.")
      )
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Box className="size-4" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">
            WMS 창고 관리
          </span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loginId">아이디</Label>
                <Input
                  id="loginId"
                  autoComplete="username"
                  autoFocus
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={!canSubmit || submitting}>
                {submitting ? "로그인 중..." : "로그인"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                계정이 없나요?{" "}
                <Link to="/signup" className="text-foreground underline">
                  가입 신청
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

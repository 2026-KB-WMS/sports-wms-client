import { Box } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import type { SignupInput } from "~/lib/api/auth"
import { ApiError } from "~/lib/api/client"
import { getErrorMessage } from "~/lib/api/error-messages"

import { getPhoneError } from "~/lib/phone"

import { useSignup } from "./hooks"
import { getPasswordError } from "./password-rules"

const LOGIN_ID_PATTERN = /^[a-z0-9_]{4,20}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 서버는 로그인 아이디를 소문자로 바꿔 저장한다. 입력 검사도 같은 기준으로 한다. */
export function SignupPage() {
  const signup = useSignup()
  const [form, setForm] = useState({
    loginId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    email: "",
    phone: "",
    role: "STORE_OWNER" as SignupInput["role"],
  })

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const loginId = form.loginId.trim().toLowerCase()
  const errors = {
    loginId:
      form.loginId !== "" && !LOGIN_ID_PATTERN.test(loginId)
        ? "영문 소문자·숫자·밑줄 4~20자로 입력해 주세요."
        : null,
    password: form.password !== "" ? getPasswordError(form.password) : null,
    passwordConfirm:
      form.passwordConfirm !== "" && form.passwordConfirm !== form.password
        ? "비밀번호가 일치하지 않습니다."
        : null,
    email:
      form.email !== "" && !EMAIL_PATTERN.test(form.email.trim())
        ? "이메일 형식이 올바르지 않습니다."
        : null,
  }

  const canSubmit =
    LOGIN_ID_PATTERN.test(loginId) &&
    getPasswordError(form.password) === null &&
    form.password === form.passwordConfirm &&
    form.name.trim() !== "" &&
    EMAIL_PATTERN.test(form.email.trim()) &&
    form.phone.trim() !== "" &&
    getPhoneError(form.phone) === null

  // 중복은 해당 필드 아래에 보여 주고, 그 밖의 오류는 폼 하단에 보여 준다.
  const errorCode =
    signup.error instanceof ApiError ? signup.error.errorCode : null
  const duplicateMessage = getErrorMessage(signup.error, "")
  const formError =
    signup.isError &&
    errorCode !== "DUPLICATE_LOGIN_ID" &&
    errorCode !== "DUPLICATE_EMAIL"
      ? getErrorMessage(signup.error, "가입 신청에 실패했습니다.")
      : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || signup.isPending) return
    signup.mutate({
      loginId,
      password: form.password,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
    })
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
            <CardTitle>
              {signup.isSuccess ? "가입 신청 완료" : "가입 신청"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signup.isSuccess ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm">
                  가입 신청이 접수되었습니다. 본사 관리자가 승인하고 소속을
                  배정한 뒤 로그인할 수 있습니다.
                </p>
                <Button render={<Link to="/login" />}>로그인 화면으로</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field label="역할" htmlFor="role">
                  <Select
                    id="role"
                    value={form.role}
                    onChange={(e) => set("role")(e.target.value)}
                  >
                    <option value="STORE_OWNER">점주</option>
                    <option value="WAREHOUSE_MANAGER">창고 관리자</option>
                  </Select>
                </Field>
                <Field
                  label="아이디"
                  htmlFor="loginId"
                  error={
                    errors.loginId ??
                    (errorCode === "DUPLICATE_LOGIN_ID"
                      ? duplicateMessage
                      : null)
                  }
                >
                  <Input
                    id="loginId"
                    autoComplete="username"
                    value={form.loginId}
                    onChange={(e) => set("loginId")(e.target.value)}
                  />
                </Field>
                <Field
                  label="비밀번호"
                  htmlFor="password"
                  error={errors.password}
                >
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set("password")(e.target.value)}
                  />
                </Field>
                <Field
                  label="비밀번호 확인"
                  htmlFor="passwordConfirm"
                  error={errors.passwordConfirm}
                >
                  <Input
                    id="passwordConfirm"
                    type="password"
                    autoComplete="new-password"
                    value={form.passwordConfirm}
                    onChange={(e) => set("passwordConfirm")(e.target.value)}
                  />
                </Field>
                <Field label="이름" htmlFor="name">
                  <Input
                    id="name"
                    autoComplete="name"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                  />
                </Field>
                <Field
                  label="이메일"
                  htmlFor="email"
                  error={
                    errors.email ??
                    (errorCode === "DUPLICATE_EMAIL" ? duplicateMessage : null)
                  }
                >
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                  />
                </Field>
                <Field
                  label="전화번호"
                  htmlFor="phone"
                  error={getPhoneError(form.phone)}
                >
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="010-1234-5678"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                  />
                </Field>
                {formError && (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                )}
                <Button type="submit" disabled={!canSubmit || signup.isPending}>
                  {signup.isPending ? "신청 중..." : "가입 신청"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  이미 계정이 있나요?{" "}
                  <Link to="/login" className="text-foreground underline">
                    로그인
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

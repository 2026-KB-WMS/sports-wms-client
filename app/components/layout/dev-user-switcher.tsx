import { useEffect, useState } from "react"

import { Input } from "~/components/ui/input"
import { Select } from "~/components/ui/select"
import { ROLES, type Role, useCurrentUser } from "~/lib/current-user"

/**
 * 로그인 연동 전까지 쓰는 임시 사용자 전환기.
 * 역할과 사용자 ID를 바꾸면 메뉴 노출과 `userId` 쿼리 값이 함께 바뀐다.
 */
export function DevUserSwitcher() {
  const { userId, role, setUser } = useCurrentUser()
  const [draft, setDraft] = useState(String(userId))

  // 저장된 값이 마운트 후 반영되면 입력란도 맞춘다.
  useEffect(() => {
    setDraft(String(userId))
  }, [userId])

  function handleUserIdChange(value: string) {
    setDraft(value)
    const next = Number(value)
    if (Number.isInteger(next) && next > 0) {
      setUser({ userId: next, role })
    }
  }

  return (
    <div className="flex flex-col gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
      <p className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
        임시 사용자 (로그인 연동 전)
      </p>
      <Select
        aria-label="역할"
        value={role}
        onChange={(e) => setUser({ userId, role: e.target.value as Role })}
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      <Input
        aria-label="사용자 ID"
        type="number"
        min={1}
        value={draft}
        onChange={(e) => handleUserIdChange(e.target.value)}
      />
    </div>
  )
}

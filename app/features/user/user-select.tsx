import { useState } from "react"

import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import type { UserRole } from "~/lib/api/user"

import { useUsers } from "./hooks"

/**
 * 소속 배정용 사용자 선택. 해당 역할의 사용자를 목록으로 보여 주고 검색어로 좁힌다.
 * 서버는 활성(ACTIVE) 사용자만 배정할 수 있다(승인 대기·비활성은 409). 승인 대기 사용자의 소속은 가입 승인 때 정한다.
 * `GET /users`는 본사 관리자 전용이며, 소속 배정도 본사 관리자만 한다.
 */
export function UserSelect({
  id,
  role,
  value,
  onChange,
}: {
  id: string
  role: UserRole
  /** 선택한 userId 문자열. 비어 있으면 미선택 */
  value: string
  onChange: (userId: string) => void
}) {
  const [keyword, setKeyword] = useState("")
  const users =
    useUsers({ role, status: "ACTIVE", keyword: keyword || undefined }).data
      ?.items ?? []

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-40">
        <Label htmlFor={`${id}-keyword`}>사용자 검색</Label>
        <Input
          id={`${id}-keyword`}
          placeholder="이름·아이디·이메일"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <div className="w-64">
        <Label htmlFor={id}>사용자</Label>
        <Select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {users.length === 0 ? "해당하는 사용자 없음" : "선택"}
          </option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.name} ({u.loginId})
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

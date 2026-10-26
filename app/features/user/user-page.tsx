import { useState } from "react"

import { Pager, SortableHead, usePaging } from "~/components/common/list-paging"
import { ConfirmDialog } from "~/components/common/confirm-dialog"
import { StatusBadge } from "~/components/common/status-badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import type { UserStatus } from "~/lib/api/auth"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { UserRole, UserSummary } from "~/lib/api/user"
import { ROLES, getRoleLabel, useCurrentUser } from "~/lib/current-user"
import { formatDateTime } from "~/features/purchase-order/format"
import { getPhoneError } from "~/lib/phone"

import { AffiliationSelect } from "./affiliation-select"
import { useUpdateUser, useUsers } from "./hooks"

/** 승인·반려·비활성화·재활성화. 서버는 PATCH의 status 하나로 처리한다. */
const STATUS_ACTIONS: Record<
  UserStatus,
  { label: string; next: UserStatus; destructive?: boolean; hint: string }[]
> = {
  PENDING: [
    {
      label: "승인",
      next: "ACTIVE",
      hint: "승인하면 로그인할 수 있습니다. 창고 관리자는 소속 창고, 점주는 소속 지점을 선택해야 합니다.",
    },
    {
      label: "반려",
      next: "INACTIVE",
      destructive: true,
      hint: "가입 신청을 반려하면 로그인할 수 없습니다.",
    },
  ],
  ACTIVE: [
    {
      label: "비활성화",
      next: "INACTIVE",
      destructive: true,
      hint: "비활성화해도 이미 발급된 로그인은 최대 1시간 유지될 수 있습니다.",
    },
  ],
  INACTIVE: [
    {
      label: "재활성화",
      next: "ACTIVE",
      hint: "창고 관리자·점주는 소속이 있어야 합니다. 이미 소속이 있으면 선택하지 않고, 없으면 창고·지점을 선택합니다.",
    },
  ],
}

type PendingAction = {
  user: UserSummary
  action: (typeof STATUS_ACTIONS)[UserStatus][number]
}

export function UserPage() {
  const { role } = useCurrentUser()
  if (role !== "HQ_ADMIN") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        사용자 관리는 본사 관리자만 볼 수 있습니다.
      </div>
    )
  }
  return <UserList />
}

function UserList() {
  const { userId: myUserId } = useCurrentUser()
  const [keyword, setKeyword] = useState("")
  const [roleFilter, setRoleFilter] = useState<"" | UserRole>("")
  const [statusFilter, setStatusFilter] = useState<"" | UserStatus>("PENDING")
  const [pending, setPending] = useState<PendingAction | null>(null)
  // 승인·재활성화 때 함께 지정하는 창고·지점 ID
  const [affiliationId, setAffiliationId] = useState("")
  const [editing, setEditing] = useState<UserSummary | null>(null)

  const filters = {
    keyword: keyword || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  }
  const paging = usePaging(JSON.stringify(filters))
  const usersQuery = useUsers({ ...filters, ...paging.params })
  const updateUser = useUpdateUser()
  const users = usersQuery.data?.items ?? []
  const pageInfo = usersQuery.data?.pageInfo
  const sort = pageInfo?.sort
  const onSort = paging.toggleSort

  function closePending(open: boolean) {
    if (open) return
    setPending(null)
    setAffiliationId("")
    updateUser.reset()
  }

  // 소속이 필요한 역할의 승인·재활성화에서만 소속을 고른다. 이미 소속이 있으면 비워 두고 status만 보낸다.
  const affiliationRole =
    pending?.action.next === "ACTIVE" && pending.user.role !== "HQ_ADMIN"
      ? pending.user.role
      : null

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-56">
              <Label htmlFor="user-keyword">검색어</Label>
              <Input
                id="user-keyword"
                placeholder="이름·아이디·이메일"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-36">
              <Label htmlFor="user-role">역할</Label>
              <Select
                id="user-role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "" | UserRole)}
              >
                <option value="">전체</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-36">
              <Label htmlFor="user-status">상태</Label>
              <Select
                id="user-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "" | UserStatus)
                }
              >
                <option value="">전체</option>
                <option value="PENDING">승인 대기</option>
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {usersQuery.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(usersQuery.error, "목록을 불러오지 못했습니다.")}
            </p>
          )}
          {!usersQuery.isLoading && !usersQuery.isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="name" sort={sort} onSort={onSort}>
                    이름
                  </SortableHead>
                  <SortableHead field="loginId" sort={sort} onSort={onSort}>
                    아이디
                  </SortableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>전화번호</TableHead>
                  <SortableHead field="role" sort={sort} onSort={onSort}>
                    역할
                  </SortableHead>
                  <SortableHead field="status" sort={sort} onSort={onSort}>
                    상태
                  </SortableHead>
                  <TableHead>최근 로그인</TableHead>
                  <TableHead className="w-px text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      조건에 맞는 사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => {
                  // 본인 계정은 role·status를 바꿀 수 없다(서버 400, 마지막 관리자 잠김 방지).
                  const isMe = user.userId === myUserId
                  return (
                    <TableRow key={user.userId}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.loginId}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{getRoleLabel(user.role)}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(user.lastLoginAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {!isMe &&
                            STATUS_ACTIONS[user.status].map((action) => (
                              <Button
                                key={action.label}
                                size="xs"
                                variant={
                                  action.destructive ? "outline" : "default"
                                }
                                onClick={() => setPending({ user, action })}
                              >
                                {action.label}
                              </Button>
                            ))}
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setEditing(user)}
                          >
                            수정
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {pageInfo && pageInfo.totalElements > 0 && (
            <Pager
              pageInfo={pageInfo}
              onPage={paging.setPage}
              onSize={paging.setSize}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={closePending}
        title={`${pending?.user.name ?? ""} ${pending?.action.label ?? ""}`}
        description={pending?.action.hint}
        confirmLabel={pending?.action.label}
        confirmDisabled={
          pending?.user.status === "PENDING" &&
          affiliationRole !== null &&
          affiliationId === ""
        }
        destructive={pending?.action.destructive}
        isPending={updateUser.isPending}
        error={
          updateUser.isError
            ? getErrorMessage(updateUser.error, "처리에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          pending &&
          updateUser.mutate(
            {
              userId: pending.user.userId,
              body: {
                status: pending.action.next,
                ...(affiliationRole && affiliationId
                  ? affiliationRole === "WAREHOUSE_MANAGER"
                    ? { warehouseId: Number(affiliationId) }
                    : { storeId: Number(affiliationId) }
                  : {}),
              },
            },
            { onSuccess: () => closePending(false) }
          )
        }
      >
        {affiliationRole && (
          <AffiliationSelect
            role={affiliationRole}
            value={affiliationId}
            onChange={setAffiliationId}
          />
        )}
      </ConfirmDialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (open) return
          setEditing(null)
          updateUser.reset()
        }}
      >
        <DialogContent>
          {editing && (
            <UserEditForm
              user={editing}
              isMe={editing.userId === myUserId}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** 바뀐 필드만 보낸다. 소속이 있는 사용자의 역할 변경은 서버가 409 AFFILIATION_ASSIGNED로 거절한다. */
function UserEditForm({
  user,
  isMe,
  onDone,
}: {
  user: UserSummary
  isMe: boolean
  onDone: () => void
}) {
  const updateUser = useUpdateUser()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [role, setRole] = useState<UserRole>(user.role)

  const body = {
    ...(name.trim() !== user.name && { name: name.trim() }),
    ...(email.trim() !== user.email && { email: email.trim() }),
    ...(phone.trim() !== user.phone && { phone: phone.trim() }),
    ...(role !== user.role && { role }),
  }
  const canSubmit =
    Object.keys(body).length > 0 &&
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    getPhoneError(phone) === null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || updateUser.isPending) return
    updateUser.mutate({ userId: user.userId, body }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>사용자 수정 ({user.loginId})</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-name">이름</Label>
        <Input
          id="edit-name"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-email">이메일</Label>
        <Input
          id="edit-email"
          type="email"
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-phone">전화번호</Label>
        <Input
          id="edit-phone"
          maxLength={30}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {getPhoneError(phone) && (
          <p className="text-sm text-destructive">{getPhoneError(phone)}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-role">역할</Label>
        <Select
          id="edit-role"
          value={role}
          disabled={isMe}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        {isMe && (
          <p className="text-xs text-muted-foreground">
            본인 계정의 역할은 바꿀 수 없습니다.
          </p>
        )}
      </div>
      {updateUser.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(updateUser.error, "수정에 실패했습니다.")}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          취소
        </Button>
        <Button type="submit" disabled={!canSubmit || updateUser.isPending}>
          {updateUser.isPending ? "저장 중..." : "저장"}
        </Button>
      </DialogFooter>
    </form>
  )
}

import { useState } from "react"
import { AddressField } from "~/components/common/address-field"

import { ConfirmDialog } from "~/components/common/confirm-dialog"
import { ReasonDialog } from "~/components/common/reason-dialog"
import { StatusBadge } from "~/components/common/status-badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
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
import { UserName } from "~/features/user/user-name"
import { UserSelect } from "~/features/user/user-select"
import { getErrorMessage } from "~/lib/api/error-messages"
import { getPhoneError } from "~/lib/phone"
import type { StoreDetail, StoreMember } from "~/lib/api/store"
import { useCurrentUser } from "~/lib/current-user"

import {
  useActivateStore,
  useAssignStoreManager,
  useDeactivateStore,
  useReleaseStoreManager,
  useStore,
  useStoreManagementTypes,
  useStoreManagers,
  useUpdateStore,
} from "./hooks"

export function StoreDetailPage({ storeId }: { storeId: number }) {
  const { role } = useCurrentUser()
  const isAdmin = role === "HQ_ADMIN"
  const storeQuery = useStore(storeId)
  const store = storeQuery.data

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {storeQuery.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {storeQuery.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(storeQuery.error, "지점을 불러오지 못했습니다.")}
        </p>
      )}
      {store && <StoreInfoCard store={store} canManage={isAdmin} />}
      {isAdmin && store && (
        <StoreManagersCard storeId={storeId} store={store} />
      )}
    </div>
  )
}

function StoreInfoCard({
  store,
  canManage,
}: {
  store: StoreDetail
  canManage: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const deactivate = useDeactivateStore()
  const [activateOpen, setActivateOpen] = useState(false)
  const activate = useActivateStore()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{store.storeName}</CardTitle>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "수정 취소" : "정보 수정"}
            </Button>
            {store.isActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deactivate.reset()
                  setDeactivateOpen(true)
                }}
              >
                비활성화
              </Button>
            )}
            {!store.isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  activate.reset()
                  setActivateOpen(true)
                }}
              >
                재활성화
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <StoreEditForm store={store} onDone={() => setEditing(false)} />
        ) : (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">지점 코드 </span>
              {store.storeCode}
            </p>
            <p>
              <span className="text-muted-foreground">상태 </span>
              <StatusBadge status={store.isActive ? "ACTIVE" : "INACTIVE"} />
            </p>
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">주소 </span>
              {store.address}
            </p>
            <p>
              <span className="text-muted-foreground">담당자 </span>
              {store.contactName ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">연락처 </span>
              {store.contactNumber}
            </p>
          </div>
        )}
      </CardContent>

      <ReasonDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="지점 비활성화"
        description="비활성화하면 신규 지점 발주 등록과 점주 배정이 막힙니다. 진행 중인 발주가 있으면 비활성화할 수 없습니다."
        required={false}
        submitLabel="비활성화"
        destructive
        isPending={deactivate.isPending}
        error={
          deactivate.isError
            ? getErrorMessage(deactivate.error, "비활성화에 실패했습니다.")
            : null
        }
        onSubmit={(reason) =>
          deactivate.mutate(
            { storeId: store.storeId, reason: reason || undefined },
            { onSuccess: () => setDeactivateOpen(false) }
          )
        }
      />

      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="지점 재활성화"
        description="다시 활성화하면 신규 지점 발주 등록과 점주 배정이 가능해집니다. 기존 배정은 그대로 다시 쓰입니다."
        confirmLabel="재활성화"
        isPending={activate.isPending}
        error={
          activate.isError
            ? getErrorMessage(activate.error, "재활성화에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          activate.mutate(store.storeId, {
            onSuccess: () => setActivateOpen(false),
          })
        }
      />
    </Card>
  )
}

function StoreEditForm({
  store,
  onDone,
}: {
  store: StoreDetail
  onDone: () => void
}) {
  const updateStore = useUpdateStore()
  const [form, setForm] = useState({
    storeName: store.storeName,
    address: store.address,
    // 주소를 바꿀 때만 채워진다. 바꾸지 않으면 보내지 않아 서버의 기존 좌표가 유지된다.
    latitude: null as number | null,
    longitude: null as number | null,
    contactName: store.contactName ?? "",
    contactNumber: store.contactNumber,
  })

  const canSubmit =
    form.storeName &&
    form.address &&
    form.contactNumber &&
    getPhoneError(form.contactNumber) === null

  function handleSubmit() {
    if (!canSubmit) return
    updateStore.mutate(
      {
        storeId: store.storeId,
        body: {
          storeName: form.storeName,
          address: form.address,
          latitude: form.latitude ?? undefined,
          longitude: form.longitude ?? undefined,
          // 비우면 null로 보내 담당자명을 지운다.
          contactName: form.contactName || null,
          contactNumber: form.contactNumber,
        },
      },
      { onSuccess: onDone }
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="edit-store-name">지점명</Label>
        <Input
          id="edit-store-name"
          value={form.storeName}
          onChange={(e) =>
            setForm((f) => ({ ...f, storeName: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="edit-store-contact-number">연락처</Label>
        <Input
          id="edit-store-contact-number"
          placeholder="010-1234-5678"
          value={form.contactNumber}
          onChange={(e) =>
            setForm((f) => ({ ...f, contactNumber: e.target.value }))
          }
        />
        {getPhoneError(form.contactNumber) && (
          <p className="text-sm text-destructive">{getPhoneError(form.contactNumber)}</p>
        )}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="edit-store-address">주소</Label>
        <p className="text-xs text-muted-foreground">
          다른 시·도로 바꾸면 지점 코드가 새로 발급됩니다.
        </p>
        <AddressField
          id="edit-store-address"
          value={form.address}
          onSelect={(r) =>
            setForm((f) => ({
              ...f,
              address: r.address,
              latitude: r.latitude,
              longitude: r.longitude,
            }))
          }
        />
      </div>
      <div>
        <Label htmlFor="edit-store-contact-name">담당자명 (선택)</Label>
        <Input
          id="edit-store-contact-name"
          value={form.contactName}
          onChange={(e) =>
            setForm((f) => ({ ...f, contactName: e.target.value }))
          }
        />
      </div>
      {updateStore.isError && (
        <p className="text-sm text-destructive sm:col-span-2">
          {getErrorMessage(updateStore.error, "수정에 실패했습니다.")}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || updateStore.isPending}
        >
          {updateStore.isPending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  )
}

function StoreManagersCard({
  storeId,
  store,
}: {
  storeId: number
  store: StoreDetail
}) {
  const managersQuery = useStoreManagers({ storeId })
  const managers = managersQuery.data?.items ?? []
  const [releasing, setReleasing] = useState<StoreMember | null>(null)
  const release = useReleaseStoreManager()
  const memberRoles = useStoreManagementTypes().data?.items ?? []

  function roleName(code: string) {
    return memberRoles.find((r) => r.code === code)?.name ?? code
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>점주·담당자 배정</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {store.isActive ? (
          <AssignForm storeId={storeId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            비활성 지점에는 새로 배정할 수 없습니다.
          </p>
        )}

        {managersQuery.isLoading && (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {managersQuery.isError && (
          <p className="text-sm text-destructive">
            {getErrorMessage(
              managersQuery.error,
              "목록을 불러오지 못했습니다."
            )}
          </p>
        )}
        {!managersQuery.isLoading &&
          !managersQuery.isError &&
          (managers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              배정된 사용자가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>배정일시</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((member) => (
                  <TableRow key={member.storeMemberId}>
                    <TableCell>
                      <UserName userId={member.userId} />
                    </TableCell>
                    <TableCell>{roleName(member.memberRole)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.assignedAt.replace("T", " ")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          release.reset()
                          setReleasing(member)
                        }}
                      >
                        배정 회수
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}
      </CardContent>

      <ConfirmDialog
        open={releasing !== null}
        onOpenChange={(open) => !open && setReleasing(null)}
        title="배정 회수"
        description={`사용자 ${releasing?.userId ?? ""}의 이 지점 배정을 회수합니다. 해당 사용자는 이 지점에 접근할 수 없게 됩니다.`}
        confirmLabel="회수"
        destructive
        isPending={release.isPending}
        error={
          release.isError
            ? getErrorMessage(release.error, "회수에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          releasing &&
          release.mutate(releasing.storeMemberId, {
            onSuccess: () => setReleasing(null),
          })
        }
      />
    </Card>
  )
}

function AssignForm({ storeId }: { storeId: number }) {
  const assign = useAssignStoreManager()
  const memberRoles = useStoreManagementTypes().data?.items ?? []
  const [userId, setUserId] = useState("")
  const [memberRole, setMemberRole] = useState("")

  const canSubmit = userId !== "" && memberRole !== ""

  function handleSubmit() {
    if (!canSubmit) return
    assign.mutate(
      { storeId, userId: Number(userId), memberRole },
      {
        onSuccess: () => {
          setUserId("")
          setMemberRole("")
        },
      }
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <UserSelect
        id="assign-user"
        role="STORE_OWNER"
        value={userId}
        onChange={setUserId}
      />
      <div className="w-40">
        <Label htmlFor="assign-member-role">역할</Label>
        <Select
          id="assign-member-role"
          value={memberRole}
          onChange={(e) => setMemberRole(e.target.value)}
        >
          <option value="">선택</option>
          {memberRoles.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>
      <Button onClick={handleSubmit} disabled={!canSubmit || assign.isPending}>
        {assign.isPending ? "배정 중..." : "배정"}
      </Button>
      {assign.isError && (
        <p className="w-full text-sm text-destructive">
          {getErrorMessage(assign.error, "배정에 실패했습니다.")}
        </p>
      )}
    </div>
  )
}

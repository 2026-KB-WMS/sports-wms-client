import { useState } from "react"

import { ConfirmDialog } from "~/components/common/confirm-dialog"
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
import type { WarehouseMember } from "~/lib/api/warehouse"

import {
  useAssignManager,
  useManagementTypes,
  useManagers,
  useReleaseManager,
} from "./hooks"

/**
 * 창고 담당자 배정 카드(본사 관리자 전용). 지점 상세의 "점주·담당자 배정"과 같은 형태다.
 * 사용자 도메인이 없어 사용자는 ID로 직접 입력하고, 존재 여부는 서버가 아직 검증하지 않는다.
 */
export function WarehouseManagersCard({
  warehouseId,
  isActive,
}: {
  warehouseId: number
  isActive: boolean
}) {
  const managersQuery = useManagers({ warehouseId })
  const managers = managersQuery.data?.items ?? []
  const [releasing, setReleasing] = useState<WarehouseMember | null>(null)
  const release = useReleaseManager()
  const memberRoles = useManagementTypes().data?.items ?? []

  function roleName(code: string) {
    return memberRoles.find((r) => r.code === code)?.name ?? code
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>담당자 배정</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isActive ? (
          <AssignForm warehouseId={warehouseId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            비활성 창고에는 새로 배정할 수 없습니다.
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
                  <TableRow key={member.warehouseMemberId}>
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
        description={`사용자 ${releasing?.userId ?? ""}의 이 창고 배정을 회수합니다. 해당 사용자는 이 창고에 접근할 수 없게 됩니다.`}
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
          release.mutate(releasing.warehouseMemberId, {
            onSuccess: () => setReleasing(null),
          })
        }
      />
    </Card>
  )
}

function AssignForm({ warehouseId }: { warehouseId: number }) {
  const assign = useAssignManager()
  const memberRoles = useManagementTypes().data?.items ?? []
  const [userId, setUserId] = useState("")
  const [memberRole, setMemberRole] = useState("")

  const canSubmit = userId !== "" && memberRole !== ""

  function handleSubmit() {
    if (!canSubmit) return
    assign.mutate(
      { warehouseId, userId: Number(userId), memberRole },
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
        id="warehouse-assign-user"
        role="WAREHOUSE_MANAGER"
        value={userId}
        onChange={setUserId}
      />
      <div className="w-40">
        <Label htmlFor="warehouse-assign-member-role">역할</Label>
        <Select
          id="warehouse-assign-member-role"
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

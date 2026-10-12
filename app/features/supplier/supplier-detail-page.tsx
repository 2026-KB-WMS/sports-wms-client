import { useState } from "react"
import { AddressField } from "~/components/common/address-field"

import { ConfirmDialog } from "~/components/common/confirm-dialog"
import { StatusBadge } from "~/components/common/status-badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { SupplierDetail } from "~/lib/api/supplier"
import { useCurrentUser } from "~/lib/current-user"

import {
  useActivateSupplier,
  useDeactivateSupplier,
  useSupplier,
  useUpdateSupplier,
} from "./hooks"

export function SupplierDetailPage({ supplierId }: { supplierId: number }) {
  const { role } = useCurrentUser()
  const supplierQuery = useSupplier(supplierId)
  const supplier = supplierQuery.data

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {supplierQuery.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {supplierQuery.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(
            supplierQuery.error,
            "공급처를 불러오지 못했습니다."
          )}
        </p>
      )}
      {supplier && (
        <SupplierInfoCard supplier={supplier} canManage={role === "HQ_ADMIN"} />
      )}
    </div>
  )
}

function SupplierInfoCard({
  supplier,
  canManage,
}: {
  supplier: SupplierDetail
  canManage: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const deactivate = useDeactivateSupplier()
  const [activateOpen, setActivateOpen] = useState(false)
  const activate = useActivateSupplier()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{supplier.supplierName}</CardTitle>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "수정 취소" : "정보 수정"}
            </Button>
            {supplier.isActive && (
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
            {!supplier.isActive && (
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
          <SupplierEditForm
            supplier={supplier}
            onDone={() => setEditing(false)}
          />
        ) : (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">공급처 코드 </span>
              {supplier.supplierCode}
            </p>
            <p>
              <span className="text-muted-foreground">상태 </span>
              <StatusBadge status={supplier.isActive ? "ACTIVE" : "INACTIVE"} />
            </p>
            <p>
              <span className="text-muted-foreground">담당자 </span>
              {supplier.managerName}
            </p>
            <p>
              <span className="text-muted-foreground">연락처 </span>
              {supplier.contactNumber}
            </p>
            <p>
              <span className="text-muted-foreground">이메일 </span>
              {supplier.email ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">주소 </span>
              {supplier.address ?? "-"}
            </p>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="공급처 비활성화"
        description="비활성화하면 신규 발주 등록이 막히고 창고 관리자 목록에서 사라집니다. 진행 중(요청·확정)인 발주가 있으면 비활성화할 수 없습니다."
        confirmLabel="비활성화"
        destructive
        isPending={deactivate.isPending}
        error={
          deactivate.isError
            ? getErrorMessage(deactivate.error, "비활성화에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          deactivate.mutate(supplier.supplierId, {
            onSuccess: () => setDeactivateOpen(false),
          })
        }
      />

      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="공급처 재활성화"
        description="다시 활성화하면 신규 발주 등록이 가능해지고 창고 관리자 목록에 다시 보입니다."
        confirmLabel="재활성화"
        isPending={activate.isPending}
        error={
          activate.isError
            ? getErrorMessage(activate.error, "재활성화에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          activate.mutate(supplier.supplierId, {
            onSuccess: () => setActivateOpen(false),
          })
        }
      />
    </Card>
  )
}

function SupplierEditForm({
  supplier,
  onDone,
}: {
  supplier: SupplierDetail
  onDone: () => void
}) {
  const updateSupplier = useUpdateSupplier()
  const [form, setForm] = useState({
    supplierName: supplier.supplierName,
    managerName: supplier.managerName,
    contactNumber: supplier.contactNumber,
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    // 주소를 바꿀 때만 채워진다. 바꾸지 않으면 보내지 않아 서버의 기존 좌표가 유지된다.
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const canSubmit = form.supplierName && form.managerName && form.contactNumber

  function handleSubmit() {
    if (!canSubmit) return
    updateSupplier.mutate(
      {
        supplierId: supplier.supplierId,
        body: {
          supplierName: form.supplierName,
          managerName: form.managerName,
          contactNumber: form.contactNumber,
          // 비우면 null로 보내 값을 지운다.
          email: form.email || null,
          address: form.address || null,
          latitude: form.latitude ?? undefined,
          longitude: form.longitude ?? undefined,
        },
      },
      { onSuccess: onDone }
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="edit-supplier-name">공급처명</Label>
        <Input
          id="edit-supplier-name"
          value={form.supplierName}
          onChange={(e) =>
            setForm((f) => ({ ...f, supplierName: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="edit-supplier-manager">담당자명</Label>
        <Input
          id="edit-supplier-manager"
          value={form.managerName}
          onChange={(e) =>
            setForm((f) => ({ ...f, managerName: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="edit-supplier-contact">연락처</Label>
        <Input
          id="edit-supplier-contact"
          value={form.contactNumber}
          onChange={(e) =>
            setForm((f) => ({ ...f, contactNumber: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="edit-supplier-email">이메일 (선택)</Label>
        <Input
          id="edit-supplier-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="edit-supplier-address">주소 (선택)</Label>
        <AddressField
          id="edit-supplier-address"
          value={form.address}
          onSelect={(r) =>
            setForm((f) => ({
              ...f,
              address: r.address,
              latitude: r.latitude,
              longitude: r.longitude,
            }))
          }
          onClear={() =>
            setForm((f) => ({
              ...f,
              address: "",
              latitude: null,
              longitude: null,
            }))
          }
        />
      </div>
      {updateSupplier.isError && (
        <p className="text-sm text-destructive sm:col-span-2">
          {getErrorMessage(updateSupplier.error, "수정에 실패했습니다.")}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || updateSupplier.isPending}
        >
          {updateSupplier.isPending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  )
}

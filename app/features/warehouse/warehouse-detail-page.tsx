import { useState } from "react"
import { Plus, X } from "lucide-react"

import { ConfirmDialog } from "~/components/common/confirm-dialog"
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
import { getErrorMessage } from "~/lib/api/error-messages"
import type { WarehouseSection } from "~/lib/api/warehouse"
import { useCurrentUser } from "~/lib/current-user"

import { CapacityEditDialog } from "./capacity-edit-dialog"
import {
  useActivateSection,
  useActivateWarehouse,
  useCreateSection,
  useDeactivateSection,
  useDeactivateWarehouse,
  useDeleteSection,
  useSectionTypes,
  useSectionsByWarehouse,
  useUpdateSection,
  useUpdateWarehouse,
  useWarehouse,
} from "./hooks"
import { WarehouseManagersCard } from "./warehouse-managers-card"

export function WarehouseDetailPage({ warehouseId }: { warehouseId: number }) {
  const { role } = useCurrentUser()
  const warehouseQuery = useWarehouse(warehouseId)
  const sectionsQuery = useSectionsByWarehouse(warehouseId)
  const [showForm, setShowForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState(false)
  const updateWarehouse = useUpdateWarehouse()
  const deactivateWarehouse = useDeactivateWarehouse()
  const activateWarehouse = useActivateWarehouse()
  const [statusOpen, setStatusOpen] = useState(false)
  const canEdit = role === "HQ_ADMIN"

  const warehouse = warehouseQuery.data
  const sections = sectionsQuery.data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {warehouseQuery.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {warehouse && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{warehouse.warehouseName}</CardTitle>
            {canEdit && (
              <Button
                variant={warehouse.isActive ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  deactivateWarehouse.reset()
                  activateWarehouse.reset()
                  setStatusOpen(true)
                }}
              >
                {warehouse.isActive ? "비활성화" : "재활성화"}
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">창고 코드 </span>
              {warehouse.warehouseCode}
            </p>
            <p>
              <span className="text-muted-foreground">상태 </span>
              <StatusBadge
                status={warehouse.isActive ? "ACTIVE" : "INACTIVE"}
              />
            </p>
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">주소 </span>
              {warehouse.address}
            </p>
            <p>
              <span className="text-muted-foreground">연락처 </span>
              {warehouse.contactNumber ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">전체 수용량 </span>
              {warehouse.totalCapacity ?? "-"}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => setEditingWarehouse(true)}
                >
                  수정
                </Button>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {warehouse && (
        <ConfirmDialog
          open={statusOpen}
          onOpenChange={setStatusOpen}
          title={warehouse.isActive ? "창고 비활성화" : "창고 재활성화"}
          description={
            warehouse.isActive
              ? "비활성화하면 신규 구역 등록·관리자 배정·발주 배정이 막힙니다. 재고가 남아 있거나 진행 중인 입고·출고·발주가 있으면 비활성화할 수 없습니다."
              : "창고를 다시 활성화합니다. 구역은 자동으로 활성화되지 않으므로 필요한 구역은 개별로 재활성화해야 합니다."
          }
          confirmLabel={warehouse.isActive ? "비활성화" : "재활성화"}
          destructive={warehouse.isActive}
          isPending={
            deactivateWarehouse.isPending || activateWarehouse.isPending
          }
          error={
            deactivateWarehouse.isError || activateWarehouse.isError
              ? getErrorMessage(
                  deactivateWarehouse.error ?? activateWarehouse.error,
                  "상태 변경에 실패했습니다."
                )
              : null
          }
          onConfirm={() =>
            (warehouse.isActive
              ? deactivateWarehouse
              : activateWarehouse
            ).mutate(warehouseId, { onSuccess: () => setStatusOpen(false) })
          }
        />
      )}

      <CapacityEditDialog
        target={
          editingWarehouse && warehouse
            ? { title: "전체 수용량 수정", current: warehouse.totalCapacity }
            : null
        }
        onClose={() => {
          setEditingWarehouse(false)
          updateWarehouse.reset()
        }}
        onSave={(totalCapacity, onSuccess) =>
          updateWarehouse.mutate(
            { warehouseId, body: { totalCapacity } },
            { onSuccess }
          )
        }
        isPending={updateWarehouse.isPending}
        error={updateWarehouse.error}
      />

      {role === "HQ_ADMIN" && warehouse && (
        <WarehouseManagersCard
          warehouseId={warehouseId}
          isActive={warehouse.isActive}
        />
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus data-icon="inline-start" />
          구역 등록
        </Button>
      </div>

      {showForm && (
        <SectionCreateForm
          warehouseId={warehouseId}
          sections={sections}
          onClose={() => setShowForm(false)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>구역 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {sectionsQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {sectionsQuery.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(
                sectionsQuery.error,
                "목록을 불러오지 못했습니다."
              )}
            </p>
          )}
          {!sectionsQuery.isLoading && !sectionsQuery.isError && (
            <SectionTable sections={sections} canEdit={canEdit} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SectionTable({
  sections,
  canEdit,
}: {
  sections: WarehouseSection[]
  canEdit: boolean
}) {
  const updateSection = useUpdateSection()
  const deactivateSection = useDeactivateSection()
  const activateSection = useActivateSection()
  const deleteSection = useDeleteSection()
  const [editing, setEditing] = useState<WarehouseSection | null>(null)
  const [action, setAction] = useState<{
    section: WarehouseSection
    kind: "deactivate" | "activate" | "delete"
  } | null>(null)

  const mutation =
    action?.kind === "delete"
      ? deleteSection
      : action?.kind === "activate"
        ? activateSection
        : deactivateSection

  function openAction(
    section: WarehouseSection,
    kind: "deactivate" | "activate" | "delete"
  ) {
    deactivateSection.reset()
    activateSection.reset()
    deleteSection.reset()
    setAction({ section, kind })
  }

  if (sections.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        등록된 구역이 없습니다.
      </p>
    )
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>구역 코드</TableHead>
            <TableHead>구역명</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>상위 구역</TableHead>
            <TableHead className="text-right">수용량</TableHead>
            <TableHead className="text-right">사용중</TableHead>
            <TableHead className="text-right">가용</TableHead>
            <TableHead>상태</TableHead>
            {canEdit && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            <TableRow key={section.sectionId}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {section.sectionCode}
              </TableCell>
              <TableCell className="font-medium">
                {section.sectionName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {section.sectionType}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {section.parentSectionCode ?? "-"}
              </TableCell>
              <TableCell className="text-right">
                {section.capacity ?? "-"}
              </TableCell>
              <TableCell className="text-right">
                {section.currentCapacity ?? "-"}
              </TableCell>
              <TableCell className="text-right">
                {section.availableCapacity ?? "-"}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={section.isActive ? "ACTIVE" : "INACTIVE"}
                />
              </TableCell>
              {canEdit && (
                <TableCell className="space-x-1 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(section)}
                  >
                    수용량 수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openAction(
                        section,
                        section.isActive ? "deactivate" : "activate"
                      )
                    }
                  >
                    {section.isActive ? "비활성화" : "재활성화"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openAction(section, "delete")}
                  >
                    삭제
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <CapacityEditDialog
        target={
          editing
            ? {
                title: `${editing.sectionName} 수용량 수정`,
                current: editing.capacity,
              }
            : null
        }
        onClose={() => {
          setEditing(null)
          updateSection.reset()
        }}
        onSave={(capacity, onSuccess) =>
          editing &&
          updateSection.mutate(
            { sectionId: editing.sectionId, body: { capacity } },
            { onSuccess }
          )
        }
        isPending={updateSection.isPending}
        error={updateSection.error}
      />
      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => !open && setAction(null)}
        title={
          action?.kind === "delete"
            ? "구역 삭제"
            : action?.kind === "activate"
              ? "구역 재활성화"
              : "구역 비활성화"
        }
        description={
          action
            ? action.kind === "delete"
              ? action.section.sectionName +
                " 구역을 삭제합니다. 재고·이력·하위 구역이 전혀 없는 구역만 삭제할 수 있고, 되돌릴 수 없습니다."
              : action.kind === "activate"
                ? action.section.sectionName +
                  " 구역을 다시 활성화합니다. 창고와 상위 구역이 활성이어야 하고, 상위 수용량을 넘을 수 없습니다."
                : action.section.sectionName +
                  " 구역을 비활성화합니다. 보유·할당 수량이 남아 있거나 활성 하위 구역이 있으면 할 수 없습니다."
            : undefined
        }
        confirmLabel={
          action?.kind === "delete"
            ? "삭제"
            : action?.kind === "activate"
              ? "재활성화"
              : "비활성화"
        }
        destructive={action?.kind !== "activate"}
        isPending={mutation.isPending}
        error={
          mutation.isError
            ? getErrorMessage(mutation.error, "처리에 실패했습니다.")
            : null
        }
        onConfirm={() =>
          action &&
          mutation.mutate(action.section.sectionId, {
            onSuccess: () => setAction(null),
          })
        }
      />
    </>
  )
}

function SectionCreateForm({
  warehouseId,
  sections,
  onClose,
}: {
  warehouseId: number
  sections: WarehouseSection[]
  onClose: () => void
}) {
  const createSection = useCreateSection()
  const sectionTypesQuery = useSectionTypes()
  const sectionTypes = sectionTypesQuery.data?.items ?? []
  const [form, setForm] = useState({
    sectionCode: "",
    sectionName: "",
    sectionType: "",
    capacity: "",
    parentSectionId: "",
  })

  const activeSections = sections.filter((s) => s.isActive)
  const parent = activeSections.find(
    (s) => String(s.sectionId) === form.parentSectionId
  )
  const childrenSum = parent
    ? activeSections
        .filter((s) => s.parentSectionId === parent.sectionId)
        .reduce((sum, s) => sum + (s.capacity ?? 0), 0)
    : 0

  const canSubmit =
    form.sectionCode &&
    form.sectionName &&
    form.sectionType &&
    form.capacity !== "" &&
    Number(form.capacity) >= 0

  function handleSubmit() {
    if (!canSubmit) return
    createSection.mutate(
      {
        warehouseId,
        sectionCode: form.sectionCode,
        sectionName: form.sectionName,
        sectionType: form.sectionType,
        capacity: Number(form.capacity),
        parentSectionId: parent?.sectionId,
      },
      {
        onSuccess: () => {
          setForm({
            sectionCode: "",
            sectionName: "",
            sectionType: "",
            capacity: "",
            parentSectionId: "",
          })
          onClose()
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>새 구역 등록</CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="닫기"
        >
          <X />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-section-code">구역 코드</Label>
          <Input
            id="new-section-code"
            value={form.sectionCode}
            onChange={(e) =>
              setForm((f) => ({ ...f, sectionCode: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-section-name">구역명</Label>
          <Input
            id="new-section-name"
            value={form.sectionName}
            onChange={(e) =>
              setForm((f) => ({ ...f, sectionName: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-section-type">구역 유형</Label>
          <Select
            id="new-section-type"
            value={form.sectionType}
            onChange={(e) =>
              setForm((f) => ({ ...f, sectionType: e.target.value }))
            }
          >
            <option value="">선택</option>
            {sectionTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="new-section-capacity">수용량 *</Label>
          <Input
            id="new-section-capacity"
            type="number"
            min={0}
            value={form.capacity}
            onChange={(e) =>
              setForm((f) => ({ ...f, capacity: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="new-section-parent">상위 구역 (선택)</Label>
          <Select
            id="new-section-parent"
            value={form.parentSectionId}
            onChange={(e) =>
              setForm((f) => ({ ...f, parentSectionId: e.target.value }))
            }
          >
            <option value="">없음 (최상위 구역)</option>
            {activeSections.map((section) => (
              <option key={section.sectionId} value={section.sectionId}>
                {section.sectionCode} · {section.sectionName}
              </option>
            ))}
          </Select>
          {parent && (
            <p className="mt-1 text-xs text-muted-foreground">
              상위 수용량 {parent.capacity ?? "-"} · 배정된 하위 합{" "}
              {childrenSum}
            </p>
          )}
        </div>
        {createSection.isError && (
          <p className="text-sm text-destructive sm:col-span-2">
            {getErrorMessage(createSection.error, "등록에 실패했습니다.")}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createSection.isPending}
          >
            {createSection.isPending ? "등록 중..." : "등록"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

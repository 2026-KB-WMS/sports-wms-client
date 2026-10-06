import { useState } from "react"
import { Plus, X } from "lucide-react"

import { Badge } from "~/components/ui/badge"
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

import {
  useCreateSection,
  useSectionTypes,
  useSectionsByWarehouse,
  useWarehouse,
} from "./hooks"

export function WarehouseDetailPage({ warehouseId }: { warehouseId: number }) {
  const warehouseQuery = useWarehouse(warehouseId)
  const sectionsQuery = useSectionsByWarehouse(warehouseId)
  const [showForm, setShowForm] = useState(false)

  const warehouse = warehouseQuery.data
  const sections = sectionsQuery.data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {warehouseQuery.isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {warehouse && (
        <Card>
          <CardHeader>
            <CardTitle>{warehouse.warehouseName}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">창고 코드 </span>
              {warehouse.warehouseCode}
            </p>
            <p>
              <span className="text-muted-foreground">상태 </span>
              <Badge variant={warehouse.isActive ? "outline" : "destructive"}>
                {warehouse.isActive ? "사용" : "미사용"}
              </Badge>
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
            </p>
          </CardContent>
        </Card>
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
              {getErrorMessage(sectionsQuery.error, "목록을 불러오지 못했습니다.")}
            </p>
          )}
          {!sectionsQuery.isLoading && !sectionsQuery.isError && (
            <SectionTable sections={sections} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SectionTable({ sections }: { sections: WarehouseSection[] }) {
  if (sections.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        등록된 구역이 없습니다.
      </p>
    )
  }
  return (
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {sections.map((section) => (
          <TableRow key={section.sectionId}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {section.sectionCode}
            </TableCell>
            <TableCell className="font-medium">{section.sectionName}</TableCell>
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
              <Badge variant={section.isActive ? "outline" : "destructive"}>
                {section.isActive ? "사용" : "미사용"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SectionCreateForm({
  warehouseId,
  onClose,
}: {
  warehouseId: number
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
  })

  const canSubmit = form.sectionCode && form.sectionName && form.sectionType

  function handleSubmit() {
    if (!canSubmit) return
    createSection.mutate(
      {
        warehouseId,
        sectionCode: form.sectionCode,
        sectionName: form.sectionName,
        sectionType: form.sectionType,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      },
      {
        onSuccess: () => {
          setForm({
            sectionCode: "",
            sectionName: "",
            sectionType: "",
            capacity: "",
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
          <Label htmlFor="new-section-capacity">수용량</Label>
          <Input
            id="new-section-capacity"
            type="number"
            value={form.capacity}
            onChange={(e) =>
              setForm((f) => ({ ...f, capacity: e.target.value }))
            }
          />
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

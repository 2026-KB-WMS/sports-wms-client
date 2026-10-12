import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Link } from "react-router"

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
import { getPhoneError } from "~/lib/phone"
import type { Supplier } from "~/lib/api/supplier"
import { useCurrentUser } from "~/lib/current-user"

import { useCreateSupplier, useSuppliers } from "./hooks"

type ActiveFilter = "" | "true" | "false"

export function SupplierPage() {
  const { role } = useCurrentUser()
  const isAdmin = role === "HQ_ADMIN"

  const [keyword, setKeyword] = useState("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("")
  const [showForm, setShowForm] = useState(false)

  // 창고 관리자는 서버가 활성 공급처만 내려주므로 상태 필터를 쓰지 않는다.
  const suppliersQuery = useSuppliers({
    keyword: keyword || undefined,
    isActive:
      isAdmin && activeFilter !== "" ? activeFilter === "true" : undefined,
  })
  const suppliers = suppliersQuery.data?.items ?? []

  if (role === "STORE_OWNER") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        공급처 화면은 본사 관리자와 창고 관리자만 볼 수 있습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus data-icon="inline-start" />
            공급처 등록
          </Button>
        </div>
      )}

      {isAdmin && showForm && (
        <SupplierCreateForm onClose={() => setShowForm(false)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>공급처 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-56">
              <Label htmlFor="supplier-keyword">검색어</Label>
              <Input
                id="supplier-keyword"
                placeholder="공급처명·코드·담당자명 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            {isAdmin && (
              <div className="w-32">
                <Label htmlFor="supplier-active">상태</Label>
                <Select
                  id="supplier-active"
                  value={activeFilter}
                  onChange={(e) =>
                    setActiveFilter(e.target.value as ActiveFilter)
                  }
                >
                  <option value="">전체</option>
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {suppliersQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {suppliersQuery.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(
                suppliersQuery.error,
                "목록을 불러오지 못했습니다."
              )}
            </p>
          )}
          {!suppliersQuery.isLoading && !suppliersQuery.isError && (
            <SupplierTable suppliers={suppliers} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SupplierTable({ suppliers }: { suppliers: Supplier[] }) {
  if (suppliers.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 공급처가 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>공급처 코드</TableHead>
          <TableHead>공급처명</TableHead>
          <TableHead>담당자</TableHead>
          <TableHead>연락처</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>상태</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow key={supplier.supplierId}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {supplier.supplierCode}
            </TableCell>
            <TableCell className="font-medium">
              {supplier.supplierName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {supplier.managerName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {supplier.contactNumber}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {supplier.email ?? "-"}
            </TableCell>
            <TableCell>
              <StatusBadge status={supplier.isActive ? "ACTIVE" : "INACTIVE"} />
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                render={<Link to={`/suppliers/${supplier.supplierId}`} />}
              >
                상세
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const EMPTY_FORM = {
  supplierCode: "",
  supplierName: "",
  managerName: "",
  contactNumber: "",
  email: "",
  address: "",
}

function SupplierCreateForm({ onClose }: { onClose: () => void }) {
  const createSupplier = useCreateSupplier()
  const [form, setForm] = useState(EMPTY_FORM)

  const canSubmit =
    form.supplierCode &&
    form.supplierName &&
    form.managerName &&
    form.contactNumber &&
    getPhoneError(form.contactNumber) === null

  function handleSubmit() {
    if (!canSubmit) return
    createSupplier.mutate(
      {
        supplierCode: form.supplierCode,
        supplierName: form.supplierName,
        managerName: form.managerName,
        contactNumber: form.contactNumber,
        email: form.email || undefined,
        address: form.address || undefined,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM)
          onClose()
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>새 공급처 등록</CardTitle>
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
          <Label htmlFor="new-supplier-code">공급처 코드</Label>
          <Input
            id="new-supplier-code"
            value={form.supplierCode}
            onChange={(e) =>
              setForm((f) => ({ ...f, supplierCode: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-supplier-name">공급처명</Label>
          <Input
            id="new-supplier-name"
            value={form.supplierName}
            onChange={(e) =>
              setForm((f) => ({ ...f, supplierName: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-supplier-manager">담당자명</Label>
          <Input
            id="new-supplier-manager"
            value={form.managerName}
            onChange={(e) =>
              setForm((f) => ({ ...f, managerName: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-supplier-contact">연락처</Label>
          <Input
            id="new-supplier-contact"
            placeholder="02-123-4567"
            value={form.contactNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactNumber: e.target.value }))
            }
          />
          {getPhoneError(form.contactNumber) && (
            <p className="text-sm text-destructive">{getPhoneError(form.contactNumber)}</p>
          )}
        </div>
        <div>
          <Label htmlFor="new-supplier-email">이메일 (선택)</Label>
          <Input
            id="new-supplier-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="new-supplier-address">주소 (선택)</Label>
          <Input
            id="new-supplier-address"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
          />
        </div>
        {createSupplier.isError && (
          <p className="text-sm text-destructive sm:col-span-2">
            {getErrorMessage(createSupplier.error, "등록에 실패했습니다.")}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createSupplier.isPending}
          >
            {createSupplier.isPending ? "등록 중..." : "등록"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

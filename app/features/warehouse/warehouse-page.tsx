import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Link } from "react-router"

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
import type { Warehouse } from "~/lib/api/warehouse"

import { useCreateWarehouse, useWarehouses } from "./hooks"

type ActiveFilter = "" | "true" | "false"

export function WarehousePage() {
  const [keyword, setKeyword] = useState("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("")
  const [showForm, setShowForm] = useState(false)

  const warehousesQuery = useWarehouses({
    keyword: keyword || undefined,
    isActive: activeFilter === "" ? undefined : activeFilter === "true",
  })
  const warehouses = warehousesQuery.data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus data-icon="inline-start" />
          창고 등록
        </Button>
      </div>

      {showForm && <WarehouseCreateForm onClose={() => setShowForm(false)} />}

      <Card>
        <CardHeader>
          <CardTitle>창고 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-56">
              <Label htmlFor="warehouse-keyword">검색어</Label>
              <Input
                id="warehouse-keyword"
                placeholder="창고명·코드·주소 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="warehouse-active">상태</Label>
              <Select
                id="warehouse-active"
                value={activeFilter}
                onChange={(e) =>
                  setActiveFilter(e.target.value as ActiveFilter)
                }
              >
                <option value="">전체</option>
                <option value="true">사용</option>
                <option value="false">미사용</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {warehousesQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {warehousesQuery.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(warehousesQuery.error, "목록을 불러오지 못했습니다.")}
            </p>
          )}
          {!warehousesQuery.isLoading && !warehousesQuery.isError && (
            <WarehouseTable warehouses={warehouses} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WarehouseTable({ warehouses }: { warehouses: Warehouse[] }) {
  if (warehouses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 창고가 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>창고 코드</TableHead>
          <TableHead>창고명</TableHead>
          <TableHead>주소</TableHead>
          <TableHead>연락처</TableHead>
          <TableHead className="text-right">전체 수용량</TableHead>
          <TableHead>상태</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {warehouses.map((warehouse) => (
          <TableRow key={warehouse.warehouseId}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {warehouse.warehouseCode}
            </TableCell>
            <TableCell className="font-medium">
              {warehouse.warehouseName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {warehouse.address}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {warehouse.contactNumber ?? "-"}
            </TableCell>
            <TableCell className="text-right">
              {warehouse.totalCapacity ?? "-"}
            </TableCell>
            <TableCell>
              <Badge variant={warehouse.isActive ? "outline" : "destructive"}>
                {warehouse.isActive ? "사용" : "미사용"}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                render={<Link to={`/warehouses/${warehouse.warehouseId}`} />}
              >
                구역 보기
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function WarehouseCreateForm({ onClose }: { onClose: () => void }) {
  const createWarehouse = useCreateWarehouse()
  const [form, setForm] = useState({
    warehouseCode: "",
    warehouseName: "",
    address: "",
    contactNumber: "",
    totalCapacity: "",
  })

  const canSubmit = form.warehouseCode && form.warehouseName && form.address

  function handleSubmit() {
    if (!canSubmit) return
    createWarehouse.mutate(
      {
        warehouseCode: form.warehouseCode,
        warehouseName: form.warehouseName,
        address: form.address,
        contactNumber: form.contactNumber || undefined,
        totalCapacity: form.totalCapacity
          ? Number(form.totalCapacity)
          : undefined,
      },
      {
        onSuccess: () => {
          setForm({
            warehouseCode: "",
            warehouseName: "",
            address: "",
            contactNumber: "",
            totalCapacity: "",
          })
          onClose()
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>새 창고 등록</CardTitle>
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
          <Label htmlFor="new-warehouse-code">창고 코드</Label>
          <Input
            id="new-warehouse-code"
            value={form.warehouseCode}
            onChange={(e) =>
              setForm((f) => ({ ...f, warehouseCode: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-warehouse-name">창고명</Label>
          <Input
            id="new-warehouse-name"
            value={form.warehouseName}
            onChange={(e) =>
              setForm((f) => ({ ...f, warehouseName: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="new-warehouse-address">주소</Label>
          <Input
            id="new-warehouse-address"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-warehouse-contact">연락처</Label>
          <Input
            id="new-warehouse-contact"
            value={form.contactNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactNumber: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-warehouse-capacity">전체 수용량</Label>
          <Input
            id="new-warehouse-capacity"
            type="number"
            value={form.totalCapacity}
            onChange={(e) =>
              setForm((f) => ({ ...f, totalCapacity: e.target.value }))
            }
          />
        </div>
        {createWarehouse.isError && (
          <p className="text-sm text-destructive sm:col-span-2">
            {getErrorMessage(createWarehouse.error, "등록에 실패했습니다.")}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createWarehouse.isPending}
          >
            {createWarehouse.isPending ? "등록 중..." : "등록"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

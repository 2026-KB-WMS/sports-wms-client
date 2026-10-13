import { useState } from "react"
import { AddressField } from "~/components/common/address-field"
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
import type { Store } from "~/lib/api/store"
import { useCurrentUser } from "~/lib/current-user"

import { useCreateStore, useMyStores, useStores } from "./hooks"

type ActiveFilter = "" | "true" | "false"

/** 본사는 전체 지점을 관리하고, 점주는 본인 소속 지점만 본다. */
export function StorePage() {
  const { role } = useCurrentUser()

  if (role === "HQ_ADMIN") return <AdminStoreList />
  if (role === "STORE_OWNER") return <MyStoreList />
  return (
    <div className="p-6 text-sm text-muted-foreground">
      지점 화면은 본사 관리자와 점주만 볼 수 있습니다.
    </div>
  )
}

function AdminStoreList() {
  const [keyword, setKeyword] = useState("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("")
  const [showForm, setShowForm] = useState(false)

  const storesQuery = useStores({
    keyword: keyword || undefined,
    isActive: activeFilter === "" ? undefined : activeFilter === "true",
  })
  const stores = storesQuery.data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus data-icon="inline-start" />
          지점 등록
        </Button>
      </div>

      {showForm && <StoreCreateForm onClose={() => setShowForm(false)} />}

      <Card>
        <CardHeader>
          <CardTitle>지점 목록</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-56">
              <Label htmlFor="store-keyword">검색어</Label>
              <Input
                id="store-keyword"
                placeholder="지점명·코드 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="store-active">상태</Label>
              <Select
                id="store-active"
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
          </div>
        </CardHeader>
        <CardContent>
          {storesQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {storesQuery.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(
                storesQuery.error,
                "목록을 불러오지 못했습니다."
              )}
            </p>
          )}
          {!storesQuery.isLoading && !storesQuery.isError && (
            <StoreTable stores={stores} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MyStoreList() {
  const myStoresQuery = useMyStores()
  const stores = myStoresQuery.data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>내 지점</CardTitle>
        </CardHeader>
        <CardContent>
          {myStoresQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {myStoresQuery.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {getErrorMessage(
                myStoresQuery.error,
                "목록을 불러오지 못했습니다."
              )}
            </p>
          )}
          {!myStoresQuery.isLoading && !myStoresQuery.isError && (
            <StoreTable
              stores={stores}
              emptyMessage="배정된 지점이 없습니다."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StoreTable({
  stores,
  emptyMessage = "조건에 맞는 지점이 없습니다.",
}: {
  stores: Store[]
  emptyMessage?: string
}) {
  if (stores.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>지점 코드</TableHead>
          <TableHead>지점명</TableHead>
          <TableHead>주소</TableHead>
          <TableHead>담당자</TableHead>
          <TableHead>연락처</TableHead>
          <TableHead>상태</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {stores.map((store) => (
          <TableRow key={store.storeId}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {store.storeCode}
            </TableCell>
            <TableCell className="font-medium">{store.storeName}</TableCell>
            <TableCell className="text-muted-foreground">
              {store.address}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {store.contactName ?? "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {store.contactNumber}
            </TableCell>
            <TableCell>
              <StatusBadge status={store.isActive ? "ACTIVE" : "INACTIVE"} />
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                render={<Link to={`/stores/${store.storeId}`} />}
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
  storeName: "",
  address: "",
  latitude: null as number | null,
  longitude: null as number | null,
  contactName: "",
  contactNumber: "",
}

function StoreCreateForm({ onClose }: { onClose: () => void }) {
  const createStore = useCreateStore()
  const [form, setForm] = useState(EMPTY_FORM)

  const canSubmit =
    form.storeName &&
    form.address &&
    form.contactNumber &&
    getPhoneError(form.contactNumber) === null

  function handleSubmit() {
    if (!canSubmit) return
    createStore.mutate(
      {
        storeName: form.storeName,
        address: form.address,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        contactName: form.contactName || undefined,
        contactNumber: form.contactNumber,
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
        <CardTitle>새 지점 등록</CardTitle>
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
          <Label htmlFor="new-store-name">지점명</Label>
          <Input
            id="new-store-name"
            value={form.storeName}
            onChange={(e) =>
              setForm((f) => ({ ...f, storeName: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="new-store-address">주소</Label>
          <AddressField
            id="new-store-address"
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
          <Label htmlFor="new-store-contact-name">담당자명 (선택)</Label>
          <Input
            id="new-store-contact-name"
            value={form.contactName}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactName: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="new-store-contact-number">연락처</Label>
          <Input
            id="new-store-contact-number"
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
        {createStore.isError && (
          <p className="text-sm text-destructive sm:col-span-2">
            {getErrorMessage(createStore.error, "등록에 실패했습니다.")}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createStore.isPending}
          >
            {createStore.isPending ? "등록 중..." : "등록"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

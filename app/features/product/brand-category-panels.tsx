import { useState } from "react"

import { StatusBadge } from "~/components/common/status-badge"
import { Button } from "~/components/ui/button"
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
import { getErrorMessage } from "~/lib/api/error-messages"
import type {
  Brand,
  BrandUpdateInput,
  Category,
  CategoryUpdateInput,
} from "~/lib/api/product"
import { useCurrentUser } from "~/lib/current-user"

import {
  useBrands,
  useCategories,
  useCreateBrand,
  useCreateCategory,
  useUpdateBrand,
  useUpdateCategory,
} from "./hooks"

/** 등록(`"new"`)·수정(대상 객체)·닫힘(`null`)을 한 값으로 다룬다. */
type Target<T> = T | "new" | null

function PanelShell({
  title,
  isLoading,
  error,
  isEmpty,
  children,
}: {
  title: string
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(error, "목록을 불러오지 못했습니다.")}
        </p>
      ) : isEmpty ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          등록된 {title}이(가) 없습니다.
        </p>
      ) : (
        children
      )}
    </div>
  )
}

/** 등록 버튼은 상품 화면 툴바에 있다. `createOpen`으로 등록 모달을 연다. */
export function BrandPanel({
  createOpen,
  onCreateClose,
}: {
  createOpen: boolean
  onCreateClose: () => void
}) {
  const { role } = useCurrentUser()
  const canEdit = role === "HQ_ADMIN"
  const query = useBrands()
  const [editTarget, setEditTarget] = useState<Brand | null>(null)
  const target: Target<Brand> = createOpen ? "new" : editTarget
  const close = () => {
    setEditTarget(null)
    onCreateClose()
  }
  const brands = query.data?.items ?? []

  return (
    <>
      <PanelShell
        title="브랜드"
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={brands.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>코드</TableHead>
              <TableHead>브랜드명</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>상태</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.brandId}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {brand.brandCode ?? "-"}
                </TableCell>
                <TableCell className="font-medium">{brand.brandName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {brand.description ?? "-"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={brand.isActive ? "ACTIVE" : "INACTIVE"}
                  />
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditTarget(brand)}
                    >
                      수정
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelShell>
      <Dialog open={target !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          {target !== null && (
            <BrandForm
              key={target === "new" ? "new" : target.brandId}
              brand={target === "new" ? null : target}
              onClose={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function BrandForm({
  brand,
  onClose,
}: {
  brand: Brand | null
  onClose: () => void
}) {
  const create = useCreateBrand()
  const update = useUpdateBrand()
  const [code, setCode] = useState("")
  const [name, setName] = useState(brand?.brandName ?? "")
  const [description, setDescription] = useState(brand?.description ?? "")
  const mutation = brand ? update : create

  // 코드는 등록 때 필수이고, 코드 없는 기존 브랜드에는 한 번만 지정할 수 있다.
  const codeEditable = brand === null || brand.brandCode === null
  const codeValid = /^[A-Za-z]{3}$/.test(code)
  const trimmed = name.trim()
  const valid =
    trimmed !== "" &&
    trimmed.length <= 100 &&
    description.length <= 500 &&
    (brand === null ? codeValid : code === "" || codeValid)

  // 수정은 바뀐 필드만 보낸다. 설명은 서버가 비우기를 지원하지 않아 빈 값은 보내지 않는다.
  const body: BrandUpdateInput = {}
  if (brand) {
    if (trimmed !== brand.brandName) body.brandName = trimmed
    if (codeEditable && code !== "") body.brandCode = code
    if (description !== "" && description !== (brand.description ?? ""))
      body.description = description
  }
  const changed = brand === null || Object.keys(body).length > 0

  function handleSubmit() {
    if (brand) {
      update.mutate({ brandId: brand.brandId, body }, { onSuccess: onClose })
    } else {
      create.mutate(
        {
          brandCode: code,
          brandName: trimmed,
          description: description || undefined,
        },
        { onSuccess: onClose }
      )
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{brand ? "브랜드 수정" : "브랜드 등록"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="brand-code">
            브랜드 코드 {brand === null ? "*" : ""}
          </Label>
          {codeEditable ? (
            <Input
              id="brand-code"
              value={code}
              maxLength={3}
              placeholder="영문 3자 (예: NIK)"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          ) : (
            <p className="py-2 font-mono text-sm text-muted-foreground">
              {brand?.brandCode}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="brand-name">브랜드명 *</Label>
          <Input
            id="brand-name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="brand-description">설명</Label>
          <Input
            id="brand-description"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {getErrorMessage(mutation.error, "저장에 실패했습니다.")}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!valid || !changed || mutation.isPending}
        >
          {mutation.isPending ? "처리 중..." : "저장"}
        </Button>
      </DialogFooter>
    </>
  )
}

export function CategoryPanel({
  createOpen,
  onCreateClose,
}: {
  createOpen: boolean
  onCreateClose: () => void
}) {
  const { role } = useCurrentUser()
  const canEdit = role === "HQ_ADMIN"
  const query = useCategories()
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const target: Target<Category> = createOpen ? "new" : editTarget
  const close = () => {
    setEditTarget(null)
    onCreateClose()
  }
  const categories = query.data?.items ?? []
  const nameById = new Map(
    categories.map((c) => [c.categoryId, c.categoryName])
  )

  return (
    <>
      <PanelShell
        title="카테고리"
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={categories.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>코드</TableHead>
              <TableHead>카테고리명</TableHead>
              <TableHead>상위 카테고리</TableHead>
              <TableHead className="text-right">정렬</TableHead>
              <TableHead>상태</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.categoryId}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {category.categoryCode}
                </TableCell>
                <TableCell className="font-medium">
                  {category.categoryName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {category.parentCategoryId == null
                    ? "-"
                    : (nameById.get(category.parentCategoryId) ?? "-")}
                </TableCell>
                <TableCell className="text-right">
                  {category.sortOrder}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={category.isActive ? "ACTIVE" : "INACTIVE"}
                  />
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditTarget(category)}
                    >
                      수정
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelShell>
      <Dialog open={target !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          {target !== null && (
            <CategoryForm
              key={target === "new" ? "new" : target.categoryId}
              category={target === "new" ? null : target}
              parents={categories.filter((c) => c.isActive)}
              onClose={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function CategoryForm({
  category,
  parents,
  onClose,
}: {
  category: Category | null
  parents: Category[]
  onClose: () => void
}) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const [code, setCode] = useState("")
  const [parentId, setParentId] = useState("")
  const [name, setName] = useState(category?.categoryName ?? "")
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0))
  const mutation = category ? update : create

  const trimmed = name.trim()
  const valid =
    trimmed !== "" &&
    trimmed.length <= 100 &&
    sortOrder !== "" &&
    Number(sortOrder) >= 0 &&
    (category !== null || (code.trim() !== "" && code.trim().length <= 50))

  // 수정은 바뀐 필드만 보낸다. 코드·상위 카테고리는 수정할 수 없다.
  const body: CategoryUpdateInput = {}
  if (category) {
    if (trimmed !== category.categoryName) body.categoryName = trimmed
    if (Number(sortOrder) !== category.sortOrder)
      body.sortOrder = Number(sortOrder)
  }
  const changed = category === null || Object.keys(body).length > 0

  function handleSubmit() {
    if (category) {
      update.mutate(
        { categoryId: category.categoryId, body },
        { onSuccess: onClose }
      )
    } else {
      create.mutate(
        {
          categoryCode: code.trim(),
          categoryName: trimmed,
          sortOrder: Number(sortOrder),
          parentCategoryId: parentId ? Number(parentId) : undefined,
        },
        { onSuccess: onClose }
      )
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {category ? "카테고리 수정" : "카테고리 등록"}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        {category === null && (
          <>
            <div>
              <Label htmlFor="category-code">카테고리 코드 *</Label>
              <Input
                id="category-code"
                value={code}
                maxLength={50}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-parent">상위 카테고리 (선택)</Label>
              <Select
                id="category-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">없음 (최상위)</option>
                {parents.map((p) => (
                  <option key={p.categoryId} value={p.categoryId}>
                    {p.categoryName}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}
        <div>
          <Label htmlFor="category-name">카테고리명 *</Label>
          <Input
            id="category-name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="category-sort">정렬 순서</Label>
          <Input
            id="category-sort"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        {category && (
          <p className="text-xs text-muted-foreground">
            카테고리 코드와 상위 카테고리는 수정할 수 없습니다.
          </p>
        )}
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {getErrorMessage(mutation.error, "저장에 실패했습니다.")}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!valid || !changed || mutation.isPending}
        >
          {mutation.isPending ? "처리 중..." : "저장"}
        </Button>
      </DialogFooter>
    </>
  )
}

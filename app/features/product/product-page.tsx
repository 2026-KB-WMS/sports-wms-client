import { useState } from "react"
import { Plus } from "lucide-react"

import { Pager, SortableHead, usePaging } from "~/components/common/list-paging"
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
import { Textarea } from "~/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { getErrorMessage } from "~/lib/api/error-messages"
import { useCurrentUser } from "~/lib/current-user"
import type { ProductSummary, ProductSkuListItem } from "~/lib/api/product"

import {
  useBrands,
  useCategories,
  useCreateProduct,
  useChangeSkuStatus,
  useCreateSku,
  useProducts,
  useSkuUnits,
  useSkus,
  useUpdateProduct,
} from "./hooks"
import { ActiveToggle } from "./active-toggle"
import { BrandPanel, CategoryPanel } from "./brand-category-panels"
import { SkuEditDialog } from "./sku-edit-dialog"
import { OptionSelects, useOptionSelection } from "./option-select"
import { SkuOptionDialog } from "./sku-option-dialog"

/** 단위 목록을 받기 전에 쓰는 기본값. 서버 기본 단위는 EA다. */
const DEFAULT_UNITS = [{ code: "EA", name: "개" }]

type Tab = "products" | "skus" | "brands" | "categories"

const CREATE_LABEL: Record<Tab, string> = {
  products: "상품 등록",
  skus: "SKU 등록",
  brands: "브랜드 등록",
  categories: "카테고리 등록",
}

/** 활성 상태 필터 값. "" = 전체. */
type ActiveFilter = "" | "true" | "false"

function activeFilterToBoolean(value: ActiveFilter): boolean | undefined {
  if (value === "") return undefined
  return value === "true"
}

export function ProductPage() {
  const [tab, setTab] = useState<Tab>("products")
  const [keyword, setKeyword] = useState("")
  const [brandId, setBrandId] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("")
  const [showProductForm, setShowProductForm] = useState(false)
  const [showSkuForm, setShowSkuForm] = useState(false)
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const { role } = useCurrentUser()
  const canCreate = role === "HQ_ADMIN"

  const brandsQuery = useBrands()
  const categoriesQuery = useCategories()

  const filters = {
    brandId: brandId ? Number(brandId) : undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    keyword: keyword || undefined,
    isActive: activeFilterToBoolean(activeFilter),
  }

  const filterKey = JSON.stringify(filters)
  const productsPaging = usePaging(filterKey)
  const skusPaging = usePaging(filterKey)
  const productsQuery = useProducts({ ...filters, ...productsPaging.params })
  const skusQuery = useSkus({ ...filters, ...skusPaging.params })

  const brands = brandsQuery.data?.items ?? []
  const categories = categoriesQuery.data?.items ?? []
  const products = productsQuery.data?.items ?? []
  const skus = skusQuery.data?.items ?? []

  const currentQuery = tab === "products" ? productsQuery : skusQuery
  const currentPaging = tab === "products" ? productsPaging : skusPaging
  const pageInfo = currentQuery.data?.pageInfo

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={tab === "products" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("products")}
        >
          상품
        </Button>
        <Button
          variant={tab === "skus" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("skus")}
        >
          SKU
        </Button>
        <Button
          variant={tab === "brands" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("brands")}
        >
          브랜드
        </Button>
        <Button
          variant={tab === "categories" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("categories")}
        >
          카테고리
        </Button>
        {canCreate && (
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (tab === "products") setShowProductForm(true)
                else if (tab === "skus") setShowSkuForm(true)
                else if (tab === "brands") setShowBrandForm(true)
                else setShowCategoryForm(true)
              }}
            >
              <Plus data-icon="inline-start" />
              {CREATE_LABEL[tab]}
            </Button>
          </div>
        )}
      </div>

      {showProductForm && (
        <ProductCreateForm
          brands={brands}
          categories={categories}
          onClose={() => setShowProductForm(false)}
        />
      )}
      {showSkuForm && (
        <SkuCreateForm
          products={products}
          onClose={() => setShowSkuForm(false)}
        />
      )}

      {(tab === "brands" || tab === "categories") && (
        <Card
          key={tab}
          className="animate-in duration-200 fade-in-0 motion-reduce:animate-none"
        >
          <CardHeader>
            <CardTitle>
              {tab === "brands" ? "브랜드 목록" : "카테고리 목록"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tab === "brands" ? (
              <BrandPanel
                createOpen={showBrandForm}
                onCreateClose={() => setShowBrandForm(false)}
              />
            ) : (
              <CategoryPanel
                createOpen={showCategoryForm}
                onCreateClose={() => setShowCategoryForm(false)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {(tab === "products" || tab === "skus") && (
        <Card
          key={tab}
          className="animate-in duration-200 fade-in-0 motion-reduce:animate-none"
        >
          <CardHeader>
            <CardTitle>
              {tab === "products" ? "상품 목록" : "SKU 목록"}
            </CardTitle>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div className="w-48">
                <Label htmlFor="product-keyword">검색어</Label>
                <Input
                  id="product-keyword"
                  placeholder="이름·코드 검색"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="w-40">
                <Label htmlFor="product-brand">브랜드</Label>
                <Select
                  id="product-brand"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">전체</option>
                  {brands.map((brand) => (
                    <option key={brand.brandId} value={brand.brandId}>
                      {brand.brandName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-40">
                <Label htmlFor="product-category">카테고리</Label>
                <Select
                  id="product-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">전체</option>
                  {categories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.categoryName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-32">
                <Label htmlFor="product-active">상태</Label>
                <Select
                  id="product-active"
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
            {currentQuery.isLoading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                불러오는 중...
              </p>
            )}
            {currentQuery.isError && (
              <p className="py-8 text-center text-sm text-destructive">
                {getErrorMessage(
                  currentQuery.error,
                  "목록을 불러오지 못했습니다."
                )}
              </p>
            )}
            {!currentQuery.isLoading &&
              !currentQuery.isError &&
              tab === "products" && (
                <ProductTable
                  products={products}
                  sort={pageInfo?.sort}
                  onSort={productsPaging.toggleSort}
                />
              )}
            {!currentQuery.isLoading &&
              !currentQuery.isError &&
              tab === "skus" && (
                <SkuTable
                  skus={skus}
                  sort={pageInfo?.sort}
                  onSort={skusPaging.toggleSort}
                />
              )}
            {pageInfo && pageInfo.totalElements > 0 && (
              <Pager
                pageInfo={pageInfo}
                onPage={currentPaging.setPage}
                onSize={currentPaging.setSize}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ProductTable({
  products,
  sort,
  onSort,
}: {
  products: ProductSummary[]
  sort?: string
  onSort: (field: string) => void
}) {
  const { role } = useCurrentUser()
  const canEdit = role === "HQ_ADMIN"
  const update = useUpdateProduct()
  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 상품이 없습니다.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead field="productCode" sort={sort} onSort={onSort}>
            상품 코드
          </SortableHead>
          <SortableHead field="productName" sort={sort} onSort={onSort}>
            상품명
          </SortableHead>
          <TableHead>브랜드</TableHead>
          <TableHead>카테고리</TableHead>
          <SortableHead field="isActive" sort={sort} onSort={onSort}>
            상태
          </SortableHead>
          {canEdit && <TableHead className="w-px" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.productId}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {product.productCode}
            </TableCell>
            <TableCell className="font-medium">{product.productName}</TableCell>
            <TableCell className="text-muted-foreground">
              {product.brandName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {product.categoryName}
            </TableCell>
            <TableCell>
              <StatusBadge status={product.isActive ? "ACTIVE" : "INACTIVE"} />
            </TableCell>
            {canEdit && (
              <TableCell className="text-right">
                <ActiveToggle
                  kind="상품"
                  name={product.productName}
                  isActive={product.isActive}
                  deactivateHint="하위 SKU가 함께 비활성화됩니다. 재고가 남아 있거나 진행 중인 입고·발주·출고가 있으면 비활성화할 수 없습니다."
                  activateHint="상품만 다시 활성화되고, 비활성화된 SKU는 자동으로 복구되지 않습니다."
                  isPending={update.isPending}
                  error={update.error}
                  reset={update.reset}
                  run={(next, onSuccess) =>
                    update.mutate(
                      {
                        productId: product.productId,
                        body: { isActive: next },
                      },
                      { onSuccess }
                    )
                  }
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SkuTable({
  skus,
  sort,
  onSort,
}: {
  skus: ProductSkuListItem[]
  sort?: string
  onSort: (field: string) => void
}) {
  const { role } = useCurrentUser()
  const canEdit = role === "HQ_ADMIN"
  const [editing, setEditing] = useState<ProductSkuListItem | null>(null)
  const [optionTarget, setOptionTarget] = useState<ProductSkuListItem | null>(
    null
  )
  const changeStatus = useChangeSkuStatus()

  if (skus.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 SKU가 없습니다.
      </p>
    )
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="skuCode" sort={sort} onSort={onSort}>
              SKU
            </SortableHead>
            <SortableHead field="productName" sort={sort} onSort={onSort}>
              상품명
            </SortableHead>
            <TableHead>단위</TableHead>
            <TableHead className="text-right">매입가</TableHead>
            <SortableHead
              field="currentSupplyPrice"
              sort={sort}
              onSort={onSort}
              className="text-right"
            >
              공급가
            </SortableHead>
            <TableHead className="text-right">안전재고</TableHead>
            <TableHead>옵션</TableHead>
            <SortableHead field="isActive" sort={sort} onSort={onSort}>
              상태
            </SortableHead>
            {canEdit && <TableHead className="w-px" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {skus.map((sku) => (
            <TableRow key={sku.skuId}>
              <TableCell className="font-medium">
                <span className="block font-mono text-xs font-normal text-muted-foreground">
                  {sku.skuCode}
                </span>
                {sku.skuName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {sku.productName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {sku.unit ?? "-"}
              </TableCell>
              <TableCell className="text-right">
                {sku.currentPurchasePrice ?? "-"}
              </TableCell>
              <TableCell className="text-right">
                {sku.currentSupplyPrice ?? "-"}
              </TableCell>
              <TableCell className="text-right">
                {sku.safetyStockQuantity ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {sku.optionValues.length > 0
                  ? sku.optionValues.map((option) => option.value).join(", ")
                  : "-"}
              </TableCell>
              <TableCell>
                <StatusBadge status={sku.isActive ? "ACTIVE" : "INACTIVE"} />
              </TableCell>
              {canEdit && (
                <TableCell className="space-x-1 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(sku)}
                  >
                    수정
                  </Button>
                  {sku.optionValues.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOptionTarget(sku)}
                    >
                      옵션
                    </Button>
                  )}
                  <ActiveToggle
                    kind="SKU"
                    name={sku.skuName}
                    isActive={sku.isActive}
                    deactivateHint="재고가 남아 있거나 진행 중인 입고·발주·출고가 있으면 비활성화할 수 없습니다."
                    activateHint="상품이 활성일 때만 재활성화할 수 있습니다."
                    isPending={changeStatus.isPending}
                    error={changeStatus.error}
                    reset={changeStatus.reset}
                    run={(next, onSuccess) =>
                      changeStatus.mutate(
                        { skuId: sku.skuId, isActive: next },
                        { onSuccess }
                      )
                    }
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <SkuEditDialog sku={editing} onClose={() => setEditing(null)} />
      <SkuOptionDialog
        sku={optionTarget}
        onClose={() => setOptionTarget(null)}
      />
    </>
  )
}

function ProductCreateForm({
  brands,
  categories,
  onClose,
}: {
  brands: { brandId: number; brandName: string; brandCode: string | null }[]
  categories: { categoryId: number; categoryName: string }[]
  onClose: () => void
}) {
  const createProduct = useCreateProduct()
  const [form, setForm] = useState({
    brandId: "",
    categoryId: "",
    productName: "",
    description: "",
  })
  const [issuedCode, setIssuedCode] = useState<string | null>(null)
  // 상품 코드는 브랜드 코드로 만들어지므로 코드가 없는 기존 브랜드는 쓸 수 없다.
  const brandNoCode =
    form.brandId !== "" &&
    brands.find((b) => String(b.brandId) === form.brandId)?.brandCode == null
  const spec = useOptionSelection(
    form.categoryId ? Number(form.categoryId) : null,
    "SPEC"
  )

  const canSubmit =
    form.brandId &&
    !brandNoCode &&
    form.categoryId &&
    form.productName &&
    spec.complete

  function handleSubmit() {
    if (!canSubmit) return
    createProduct.mutate(
      {
        brandId: Number(form.brandId),
        categoryId: Number(form.categoryId),
        productName: form.productName,
        description: form.description || undefined,
        specOptionValueIds: spec.groups.length > 0 ? spec.ids : undefined,
      },
      {
        onSuccess: (product) => {
          spec.reset()
          setForm({
            brandId: "",
            categoryId: "",
            productName: "",
            description: "",
          })
          setIssuedCode(product.productCode)
        },
      }
    )
  }

  if (issuedCode) {
    return (
      <IssuedDialog
        title="상품을 등록했습니다"
        rows={[["상품 코드", issuedCode]]}
        onClose={onClose}
      />
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>새 상품 등록</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="new-product-name">상품명</Label>
            <Input
              id="new-product-name"
              value={form.productName}
              onChange={(e) =>
                setForm((f) => ({ ...f, productName: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="new-product-brand">브랜드</Label>
            <Select
              id="new-product-brand"
              value={form.brandId}
              onChange={(e) =>
                setForm((f) => ({ ...f, brandId: e.target.value }))
              }
            >
              <option value="">선택</option>
              {brands.map((brand) => (
                <option key={brand.brandId} value={brand.brandId}>
                  {brand.brandName}
                  {brand.brandCode == null && " (코드 없음)"}
                </option>
              ))}
            </Select>
            {brandNoCode && (
              <p className="mt-1 text-xs text-destructive">
                브랜드 코드가 없어 상품을 등록할 수 없습니다. 브랜드 탭에서
                코드를 먼저 지정해 주세요.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="new-product-category">카테고리</Label>
            <Select
              id="new-product-category"
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
            >
              <option value="">선택</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </Select>
          </div>
          {spec.groups.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                스펙은 상품 단위 값입니다. SKU마다 다른 값은 SKU 등록에서
                고릅니다.
              </p>
              <OptionSelects state={spec} idPrefix="new-product-spec" />
            </>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="new-product-description">설명</Label>
            <Textarea
              id="new-product-description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            상품 코드는 등록하면 서버가 발급합니다.
          </p>
          {createProduct.isError && (
            <p className="text-sm text-destructive sm:col-span-2">
              {getErrorMessage(createProduct.error, "등록에 실패했습니다.")}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createProduct.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createProduct.isPending}
          >
            {createProduct.isPending ? "등록 중..." : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SkuCreateForm({
  products,
  onClose,
}: {
  products: { productId: number; productName: string; categoryId: number }[]
  onClose: () => void
}) {
  const createSku = useCreateSku()
  const units = useSkuUnits().data?.items ?? DEFAULT_UNITS
  const [form, setForm] = useState({
    productId: "",
    unit: "EA",
    weight: "",
    currentPurchasePrice: "",
    currentSupplyPrice: "",
    safetyStockQuantity: "",
    barcode: "",
  })
  const [issued, setIssued] = useState<{ code: string; name: string } | null>(
    null
  )
  const categoryId =
    products.find((p) => String(p.productId) === form.productId)?.categoryId ??
    null
  const option = useOptionSelection(categoryId, "SKU")

  const isPrice = (v: string) => v !== "" && Number(v) >= 0
  const canSubmit =
    form.productId &&
    option.complete &&
    isPrice(form.currentPurchasePrice) &&
    isPrice(form.currentSupplyPrice)

  function handleSubmit() {
    if (!canSubmit) return
    createSku.mutate(
      {
        productId: Number(form.productId),
        optionValueIds: option.groups.length > 0 ? option.ids : undefined,
        unit: form.unit,
        barcode: form.barcode || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        currentPurchasePrice: Number(form.currentPurchasePrice),
        currentSupplyPrice: Number(form.currentSupplyPrice),
        safetyStockQuantity: form.safetyStockQuantity
          ? Number(form.safetyStockQuantity)
          : undefined,
      },
      {
        onSuccess: (sku) => {
          option.reset()
          setForm({
            productId: "",
            unit: "EA",
            weight: "",
            currentPurchasePrice: "",
            currentSupplyPrice: "",
            safetyStockQuantity: "",
            barcode: "",
          })
          setIssued({ code: sku.skuCode, name: sku.skuName })
        },
      }
    )
  }

  if (issued) {
    return (
      <IssuedDialog
        title="SKU를 등록했습니다"
        rows={[
          ["SKU 코드", issued.code],
          ["SKU명", issued.name],
        ]}
        onClose={onClose}
      />
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>새 SKU 등록</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="new-sku-product">상품</Label>
            <Select
              id="new-sku-product"
              value={form.productId}
              onChange={(e) =>
                setForm((f) => ({ ...f, productId: e.target.value }))
              }
            >
              <option value="">선택</option>
              {products.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.productName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="new-sku-unit">단위</Label>
            <Select
              id="new-sku-unit"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            >
              {units.map((unit) => (
                <option key={unit.code} value={unit.code}>
                  {unit.code} ({unit.name})
                </option>
              ))}
            </Select>
          </div>
          <OptionSelects state={option} idPrefix="new-sku-option" />
          <div>
            <Label htmlFor="new-sku-barcode">바코드</Label>
            <Input
              id="new-sku-barcode"
              value={form.barcode}
              onChange={(e) =>
                setForm((f) => ({ ...f, barcode: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="new-sku-weight">중량</Label>
            <Input
              id="new-sku-weight"
              type="number"
              value={form.weight}
              onChange={(e) =>
                setForm((f) => ({ ...f, weight: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="new-sku-purchase">매입 단가 *</Label>
            <Input
              id="new-sku-purchase"
              type="number"
              min={0}
              value={form.currentPurchasePrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentPurchasePrice: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="new-sku-supply">공급 단가 *</Label>
            <Input
              id="new-sku-supply"
              type="number"
              min={0}
              value={form.currentSupplyPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentSupplyPrice: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="new-sku-safety">안전 재고</Label>
            <Input
              id="new-sku-safety"
              type="number"
              value={form.safetyStockQuantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, safetyStockQuantity: e.target.value }))
              }
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-3">
            SKU 코드와 이름은 선택한 옵션으로 서버가 만듭니다. 코드가 없는 이전
            옵션 값은 목록에 나오지 않습니다.
          </p>
          {createSku.isError && (
            <p className="text-sm text-destructive sm:col-span-3">
              {getErrorMessage(createSku.error, "등록에 실패했습니다.")}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createSku.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createSku.isPending}
          >
            {createSku.isPending ? "등록 중..." : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 서버가 발급한 코드·이름을 등록 직후 보여 준다. */
function IssuedDialog({
  title,
  rows,
  onClose,
}: {
  title: string
  rows: [string, string][]
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-[6rem_1fr] gap-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-mono break-all">{value}</dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <Button onClick={onClose}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

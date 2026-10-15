import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 상품 도메인 (Brand / Category / Product / ProductSku / OptionGroup / OptionValue) API.
 * wms-server의 com.kb.wms.product 컨트롤러들과 1:1로 대응한다.
 */

// ── 브랜드 ──────────────────────────────────────────────

export interface Brand {
  brandId: number
  /** 코드 도입 전 브랜드는 null */
  brandCode: string | null
  brandName: string
  description: string | null
  isActive: boolean
}

export interface BrandCreateInput {
  /** 영문 3자. 서버가 대문자로 저장한다. */
  brandCode: string
  brandName: string
  description?: string | null
}

export function getBrands(params?: { keyword?: string; isActive?: boolean }) {
  return apiClient.get<ListData<Brand>>("/api/v1/products/brands", {
    query: params,
  })
}

export function createBrand(body: BrandCreateInput) {
  return apiClient.post<Brand & { createdAt: string }>(
    "/api/v1/products/brands",
    body
  )
}

/**
 * 본사 관리자만. 바뀐 필드만 보낸다(최소 1개). 다른 브랜드가 쓰는 이름은 409 `DUPLICATE_BRAND_NAME`.
 * 브랜드·카테고리 비활성화 API는 서버에 없다.
 */
export interface BrandUpdateInput {
  /** 코드가 없는 기존 브랜드에 한 번만 지정할 수 있다(이미 있으면 400). */
  brandCode?: string
  brandName?: string
  description?: string
}

export function updateBrand(brandId: number, body: BrandUpdateInput) {
  return apiClient.patch<Brand>(`/api/v1/products/brands/${brandId}`, body)
}

// ── 카테고리 ──────────────────────────────────────────────

export interface Category {
  categoryId: number
  parentCategoryId: number | null
  categoryCode: string
  categoryName: string
  depth: number
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface CategoryCreateInput {
  parentCategoryId?: number | null
  /** 영문 3자. 서버가 대문자로 저장한다(브랜드 코드와 같은 규칙). */
  categoryCode: string
  categoryName: string
  sortOrder?: number
}

export function getCategories(params?: {
  parentCategoryId?: number
  depth?: number
  keyword?: string
  isActive?: boolean
}) {
  return apiClient.get<ListData<Category>>("/api/v1/products/categories", {
    query: params,
  })
}

export function createCategory(body: CategoryCreateInput) {
  return apiClient.post<Category>("/api/v1/products/categories", body)
}

/** 본사 관리자만. `categoryCode`·`parentCategoryId`는 보내면 400이다. */
export interface CategoryUpdateInput {
  categoryName?: string
  sortOrder?: number
}

export function updateCategory(categoryId: number, body: CategoryUpdateInput) {
  return apiClient.patch<Category>(
    `/api/v1/products/categories/${categoryId}`,
    body
  )
}

// ── 상품 ──────────────────────────────────────────────

export interface ProductSummary {
  productId: number
  productCode: string
  productName: string
  brandId: number
  brandName: string
  categoryId: number
  categoryName: string
  isActive: boolean
}

export interface ProductSpec {
  optionGroupId: number
  optionGroupName: string
  optionValueId: number
  optionCode: string | null
  value: string
}

export interface ProductDetail extends ProductSummary {
  /** 상세·등록·수정 응답에만 있다(목록에는 없음). */
  specs?: ProductSpec[]
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductCreateInput {
  brandId: number
  categoryId: number
  /** 상품 코드는 서버가 `브랜드코드-카테고리코드-일련번호`로 발급한다(보내지 않는다). */
  productName: string
  description?: string | null
  /** 카테고리에 SPEC으로 지정된 옵션 그룹마다 값 하나씩. 지정된 그룹이 없으면 생략한다. */
  specOptionValueIds?: number[]
}

export interface ProductUpdateInput {
  productName?: string
  description?: string | null
  brandId?: number
  categoryId?: number
  isActive?: boolean
  /** 보내면 스펙 전체를 교체한다. 스펙·SKU가 있는 상품의 카테고리 변경은 409. */
  specOptionValueIds?: number[]
}

export function getProducts(params?: {
  brandId?: number
  categoryId?: number
  keyword?: string
  isActive?: boolean
}) {
  return apiClient.get<ListData<ProductSummary>>("/api/v1/products", {
    query: params,
  })
}

export function getProduct(productId: number) {
  return apiClient.get<ProductDetail>(`/api/v1/products/${productId}`)
}

export function createProduct(body: ProductCreateInput) {
  return apiClient.post<ProductDetail>("/api/v1/products", body)
}

export function updateProduct(productId: number, body: ProductUpdateInput) {
  return apiClient.patch<ProductDetail>(`/api/v1/products/${productId}`, body)
}

// ── SKU ──────────────────────────────────────────────

export interface SkuOptionValue {
  optionGroupId: number
  optionGroupName: string
  optionValueId: number
  value: string
}

export interface ProductSkuListItem {
  skuId: number
  skuCode: string
  barcode: string | null
  skuName: string
  productId: number
  productName: string
  unit: string | null
  weight: number | null
  currentPurchasePrice: number
  currentSupplyPrice: number
  safetyStockQuantity: number | null
  isActive: boolean
  optionValues: SkuOptionValue[]
}

export interface ProductSkuDetail extends Omit<
  ProductSkuListItem,
  "productName"
> {
  productCode: string
  productName: string
  brandId: number
  brandName: string
  categoryId: number
  categoryName: string
  createdAt: string
  updatedAt: string
}

export interface ProductSkuCreateInput {
  productId: number
  /** `skuCode`·`skuName`은 서버가 옵션 코드·값으로 만든다(보내지 않는다). 이름만 등록 후 수정할 수 있다. */
  barcode?: string | null
  weight?: number | null
  currentPurchasePrice: number
  currentSupplyPrice: number
  unit?: string | null
  safetyStockQuantity?: number | null
  /** 카테고리에 SKU로 지정된 옵션 그룹마다 값 하나씩. 지정된 그룹이 없으면 생략한다. */
  optionValueIds?: number[]
}

export function getSkus(params?: {
  productId?: number
  brandId?: number
  categoryId?: number
  keyword?: string
  isActive?: boolean
}) {
  return apiClient.get<ListData<ProductSkuListItem>>("/api/v1/products/skus", {
    query: params,
  })
}

export interface SkuUnit {
  code: string
  name: string
}

/** 등록 요청의 `unit`에는 `code`를 보낸다(EA·BOX·SET). 목록 밖 값은 400이다. */
export function getSkuUnits() {
  return apiClient.get<ListData<SkuUnit>>("/api/v1/products/skus/units")
}

export function getSku(skuId: number) {
  return apiClient.get<ProductSkuDetail>(`/api/v1/products/skus/${skuId}`)
}

export function createSku(body: ProductSkuCreateInput) {
  return apiClient.post<ProductSkuListItem & { createdAt: string }>(
    "/api/v1/products/skus",
    body
  )
}

/** 바뀐 필드만 보낸다(최소 1개). skuCode·productId·unit·isActive는 보내면 400이다. */
export interface ProductSkuUpdateInput {
  skuName?: string
  barcode?: string
  weight?: number
  currentPurchasePrice?: number
  currentSupplyPrice?: number
  safetyStockQuantity?: number
}

/** HQ_ADMIN만 호출한다. 비활성 SKU도 수정할 수 있고, 409 DUPLICATE_BARCODE가 날 수 있다. */
export function updateSku(skuId: number, body: ProductSkuUpdateInput) {
  return apiClient.patch<ProductSkuListItem>(
    `/api/v1/products/skus/${skuId}`,
    body
  )
}

export function changeSkuStatus(skuId: number, isActive: boolean) {
  return apiClient.patch<{ skuId: number; isActive: boolean }>(
    `/api/v1/products/skus/${skuId}/status`,
    { isActive }
  )
}

/**
 * 본사 관리자만. 옵션이 없는 기존 SKU에 한 번만 연결할 수 있다(이미 있으면 409 `SKU_OPTIONS_ALREADY_CONNECTED`).
 * 등록과 같은 검증(지정된 SKU 그룹마다 값 1개)을 거치고 연결 해제 API는 없다. 새 SKU는 등록 요청에서 함께 보낸다.
 */
export function connectSkuOptions(skuId: number, optionValueIds: number[]) {
  return apiClient.post<{ skuId: number; optionValues: SkuOptionValue[] }>(
    `/api/v1/products/skus/${skuId}/options`,
    { optionValueIds }
  )
}

// ── 옵션 그룹 / 옵션 값 ──────────────────────────────────────────────

export type CategoryOptionType = "SPEC" | "SKU"

export interface OptionGroup {
  optionGroupId: number
  name: string
  createdAt: string
}

export interface OptionValue {
  optionValueId: number
  optionGroupId: number
  /** 코드 도입 전에 만든 값은 null이고, 수정 API는 없다. */
  optionCode: string | null
  value: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface OptionGroupValue {
  optionValueId: number
  optionCode: string | null
  value: string
  sortOrder: number
  isActive: boolean
}

/** `GET /products/option-groups` 항목. 비활성 값도 포함한다. */
export interface OptionGroupWithValues {
  optionGroupId: number
  name: string
  values: OptionGroupValue[]
}

/** 카테고리에 적용되는 옵션 그룹(상위 카테고리 지정 상속 포함). */
export interface CategoryOptionGroup extends OptionGroupWithValues {
  optionType: CategoryOptionType
  sortOrder: number
  /** 지정을 등록한 카테고리 */
  definedCategoryId: number
  /** true이면 상위에서 상속한 지정이라 이 카테고리에서 바꿀 수 없다. */
  inherited: boolean
}

export interface CategoryOptionGroupInput {
  optionGroupId: number
  optionType: CategoryOptionType
  sortOrder?: number
}

export function createOptionGroup(name: string) {
  return apiClient.post<OptionGroup>("/api/v1/products/option-groups", { name })
}

export function getOptionGroups() {
  return apiClient.get<ListData<OptionGroupWithValues>>(
    "/api/v1/products/option-groups"
  )
}

export function getCategoryOptionGroups(categoryId: number) {
  return apiClient.get<ListData<CategoryOptionGroup>>(
    `/api/v1/products/categories/${categoryId}/option-groups`
  )
}

/** 본사 관리자만. 이 카테고리 자신의 지정 전체를 교체한다(빈 목록이면 모두 지움). 응답은 상속을 합친 결과다. */
export function replaceCategoryOptionGroups(
  categoryId: number,
  items: CategoryOptionGroupInput[]
) {
  return apiClient.put<ListData<CategoryOptionGroup>>(
    `/api/v1/products/categories/${categoryId}/option-groups`,
    { items }
  )
}

export function createOptionValue(
  optionGroupId: number,
  body: { optionCode: string; value: string; sortOrder?: number }
) {
  return apiClient.post<OptionValue>(
    `/api/v1/products/option-groups/${optionGroupId}/values`,
    body
  )
}

export interface SkuSupplier {
  supplierId: number
  supplierCode: string
  supplierName: string
  isActive: boolean
  createdAt: string
}

/**
 * SKU에 매핑된 공급처 목록(본사·창고 관리자, 점주는 403). 확정 때 라인별 공급처 후보로 쓴다.
 * 등록·삭제는 본사 관리자 전용이며 별도 화면에서 다룬다.
 */
export function getSkuSuppliers(skuId: number) {
  return apiClient.get<ListData<SkuSupplier>>(
    `/api/v1/products/skus/${skuId}/suppliers`
  )
}

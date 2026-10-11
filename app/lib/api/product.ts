import { apiClient } from "./client"
import type { ListData } from "./types"

/**
 * 상품 도메인 (Brand / Category / Product / ProductSku / OptionGroup / OptionValue) API.
 * wms-server의 com.kb.wms.product 컨트롤러들과 1:1로 대응한다.
 */

// ── 브랜드 ──────────────────────────────────────────────

export interface Brand {
  brandId: number
  brandName: string
  description: string | null
  isActive: boolean
}

export interface BrandCreateInput {
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

export interface ProductDetail extends ProductSummary {
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductCreateInput {
  brandId: number
  categoryId: number
  productCode: string
  productName: string
  description?: string | null
}

export interface ProductUpdateInput {
  productName?: string
  description?: string | null
  brandId?: number
  categoryId?: number
  isActive?: boolean
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
  skuCode: string
  barcode?: string | null
  skuName: string
  weight?: number | null
  currentPurchasePrice: number
  currentSupplyPrice: number
  unit?: string | null
  safetyStockQuantity?: number | null
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
 * 본사 관리자만. 옵션 그룹당 값 1개만 연결할 수 있고(409 `OPTION_GROUP_CONFLICT`), 연결 해제 API는 없다.
 * 이미 연결된 값은 409 `DUPLICATE_OPTION_VALUE`.
 */
export function connectSkuOptions(skuId: number, optionValueIds: number[]) {
  return apiClient.post<{ skuId: number; optionValues: SkuOptionValue[] }>(
    `/api/v1/products/skus/${skuId}/options`,
    { optionValueIds }
  )
}

// ── 옵션 그룹 / 옵션 값 ──────────────────────────────────────────────

export interface OptionGroup {
  optionGroupId: number
  name: string
  createdAt: string
}

export interface OptionValue {
  optionValueId: number
  optionGroupId: number
  value: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface ProductOptionGroups {
  productId: number
  items: {
    optionGroupId: number
    name: string
    values: { optionValueId: number; value: string; sortOrder: number }[]
  }[]
}

export function createOptionGroup(name: string) {
  return apiClient.post<OptionGroup>("/api/v1/products/option-groups", { name })
}

export function getOptionGroupsByProduct(productId: number) {
  return apiClient.get<ProductOptionGroups>(
    `/api/v1/products/${productId}/option-groups`
  )
}

export function createOptionValue(
  optionGroupId: number,
  value: string,
  sortOrder?: number
) {
  return apiClient.post<OptionValue>(
    `/api/v1/products/option-groups/${optionGroupId}/values`,
    {
      value,
      sortOrder,
    }
  )
}

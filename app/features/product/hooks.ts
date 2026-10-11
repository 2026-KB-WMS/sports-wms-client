import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as productApi from "~/lib/api/product"

/**
 * 상품 도메인 TanStack Query 훅. 쿼리 키는 ["product", 리소스, 조건] 형태로 통일한다.
 */

export function useBrands(params?: Parameters<typeof productApi.getBrands>[0]) {
  return useQuery({
    queryKey: ["product", "brands", params],
    queryFn: () => productApi.getBrands(params),
  })
}

export function useCategories(
  params?: Parameters<typeof productApi.getCategories>[0]
) {
  return useQuery({
    queryKey: ["product", "categories", params],
    queryFn: () => productApi.getCategories(params),
  })
}

export function useProducts(
  params?: Parameters<typeof productApi.getProducts>[0]
) {
  return useQuery({
    queryKey: ["product", "products", params],
    queryFn: () => productApi.getProducts(params),
  })
}

export function useProduct(productId: number | null) {
  return useQuery({
    queryKey: ["product", "products", "detail", productId],
    queryFn: () => productApi.getProduct(productId as number),
    enabled: productId != null,
  })
}

export function useSkus(params?: Parameters<typeof productApi.getSkus>[0]) {
  return useQuery({
    queryKey: ["product", "skus", params],
    queryFn: () => productApi.getSkus(params),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productApi.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", "brands"] })
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", "categories"] })
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", "products"] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      body,
    }: {
      productId: number
      body: productApi.ProductUpdateInput
    }) => productApi.updateProduct(productId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", "products"] })
    },
  })
}

export function useCreateSku() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productApi.createSku,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", "skus"] })
    },
  })
}

export function useUpdateSku() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      skuId,
      body,
    }: {
      skuId: number
      body: productApi.ProductSkuUpdateInput
    }) => productApi.updateSku(skuId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", "skus"] })
    },
  })
}

export function useChangeSkuStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ skuId, isActive }: { skuId: number; isActive: boolean }) =>
      productApi.changeSkuStatus(skuId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", "skus"] })
    },
  })
}

export function useOptionGroupsByProduct(productId: number | null) {
  return useQuery({
    queryKey: ["product", "option-groups", productId],
    queryFn: () => productApi.getOptionGroupsByProduct(productId as number),
    enabled: productId != null,
  })
}

export function useCreateOptionGroup() {
  return useMutation({ mutationFn: productApi.createOptionGroup })
}

export function useCreateOptionValue() {
  return useMutation({
    mutationFn: ({
      optionGroupId,
      value,
    }: {
      optionGroupId: number
      value: string
    }) => productApi.createOptionValue(optionGroupId, value),
  })
}

export function useConnectSkuOptions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      skuId,
      optionValueIds,
    }: {
      skuId: number
      optionValueIds: number[]
    }) => productApi.connectSkuOptions(skuId, optionValueIds),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
}

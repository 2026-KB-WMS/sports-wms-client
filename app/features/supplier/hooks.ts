import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as supplierApi from "~/lib/api/supplier"

/**
 * 공급처 도메인 TanStack Query 훅. 쿼리 키는 ["supplier", 리소스, 조건] 형태로 통일한다.
 */

export function useSuppliers(
  params?: Parameters<typeof supplierApi.getSuppliers>[0]
) {
  return useQuery({
    queryKey: ["supplier", "suppliers", params],
    queryFn: () => supplierApi.getSuppliers(params),
  })
}

export function useSupplier(supplierId: number | null) {
  return useQuery({
    queryKey: ["supplier", "suppliers", "detail", supplierId],
    queryFn: () => supplierApi.getSupplier(supplierId as number),
    enabled: supplierId != null,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: supplierApi.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier"] })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      supplierId,
      body,
    }: {
      supplierId: number
      body: supplierApi.SupplierUpdateInput
    }) => supplierApi.updateSupplier(supplierId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier"] })
    },
  })
}

export function useActivateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: supplierApi.activateSupplier,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier"] })
    },
  })
}

export function useDeactivateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: supplierApi.deactivateSupplier,
    // 409로 실패해도(이미 비활성 등) 최신 상태를 다시 읽는다.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier"] })
    },
  })
}

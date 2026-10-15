import { useQuery } from "@tanstack/react-query"

import * as supplierOrderApi from "~/lib/api/supplier-order"

/** 공급처 발주서 도메인 TanStack Query 훅(조회 전용). 쿼리 키는 ["supplier-order", 리소스, 조건]. */

export function useSupplierOrders(
  params?: Parameters<typeof supplierOrderApi.getSupplierOrders>[0],
  enabled = true
) {
  return useQuery({
    queryKey: ["supplier-order", "list", params],
    queryFn: () => supplierOrderApi.getSupplierOrders(params),
    enabled,
  })
}

export function useSupplierOrder(supplierOrderId: number | null) {
  return useQuery({
    queryKey: ["supplier-order", "detail", supplierOrderId],
    queryFn: () => supplierOrderApi.getSupplierOrder(supplierOrderId as number),
    enabled: supplierOrderId != null,
  })
}

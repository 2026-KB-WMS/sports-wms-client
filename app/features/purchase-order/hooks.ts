import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as purchaseOrderApi from "~/lib/api/purchase-order"
import * as warehouseApi from "~/lib/api/warehouse"
import { useCurrentUser } from "~/lib/current-user"

/**
 * 창고 발주 도메인 TanStack Query 훅.
 * 쿼리 키는 ["purchase-order", 리소스, 조건] 형태로 통일한다.
 */

export function usePurchaseOrders(
  params?: Parameters<typeof purchaseOrderApi.getPurchaseOrders>[0]
) {
  return useQuery({
    queryKey: ["purchase-order", "list", params],
    queryFn: () => purchaseOrderApi.getPurchaseOrders(params),
  })
}

export function usePurchaseOrder(purchaseOrderId: number | null) {
  return useQuery({
    queryKey: ["purchase-order", "detail", purchaseOrderId],
    queryFn: () => purchaseOrderApi.getPurchaseOrder(purchaseOrderId as number),
    enabled: purchaseOrderId != null,
  })
}

export function usePurchaseOrderLines(purchaseOrderId: number | null) {
  return useQuery({
    queryKey: ["purchase-order", "lines", purchaseOrderId],
    queryFn: () =>
      purchaseOrderApi.getPurchaseOrderDetails(purchaseOrderId as number),
    enabled: purchaseOrderId != null,
  })
}

/**
 * 발주 화면에서 고를 수 있는 창고.
 * 본사 관리자는 전체, 창고 관리자는 본인 담당 창고만(타 창고는 서버가 403).
 */
export function useSelectableWarehouses() {
  const { userId, role } = useCurrentUser()
  const isManager = role === "WAREHOUSE_MANAGER"

  const all = useQuery({
    queryKey: ["warehouse", "warehouses", { isActive: true }],
    queryFn: () => warehouseApi.getWarehouses({ isActive: true }),
    enabled: !isManager,
  })
  const mine = useQuery({
    queryKey: ["warehouse", "my", userId],
    queryFn: () => warehouseApi.getMyWarehouses(userId),
    enabled: isManager,
  })

  const items = (isManager ? mine.data?.items : all.data?.items) ?? []
  return items.map((w) => ({
    warehouseId: w.warehouseId,
    warehouseName: w.warehouseName,
  }))
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  const { userId } = useCurrentUser()
  return useMutation({
    mutationFn: (
      body: Parameters<typeof purchaseOrderApi.createPurchaseOrder>[1]
    ) => purchaseOrderApi.createPurchaseOrder(userId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] })
    },
  })
}

export function useConfirmPurchaseOrder() {
  const queryClient = useQueryClient()
  const { userId } = useCurrentUser()
  return useMutation({
    mutationFn: (purchaseOrderId: number) =>
      purchaseOrderApi.confirmPurchaseOrder(userId, purchaseOrderId),
    // 409(이미 전이됨 등)여도 최신 상태를 다시 읽는다.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] })
    },
  })
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient()
  const { userId } = useCurrentUser()
  return useMutation({
    mutationFn: ({
      purchaseOrderId,
      reason,
    }: {
      purchaseOrderId: number
      reason?: string
    }) =>
      purchaseOrderApi.cancelPurchaseOrder(
        userId,
        purchaseOrderId,
        reason ? { reason } : undefined
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] })
    },
  })
}

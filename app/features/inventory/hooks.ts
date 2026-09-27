import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as inventoryApi from "~/lib/api/inventory"

/**
 * 재고 도메인 TanStack Query 훅. 쿼리 키는 ["inventory", 리소스, 조건] 형태로 통일한다.
 */

export function useInventories(
  params?: Parameters<typeof inventoryApi.getInventories>[0]
) {
  return useQuery({
    queryKey: ["inventory", "summary", params],
    queryFn: () => inventoryApi.getInventories(params),
  })
}

export function useInventoriesByLot(
  params?: Parameters<typeof inventoryApi.getInventoriesByLot>[0]
) {
  return useQuery({
    queryKey: ["inventory", "by-lot", params],
    queryFn: () => inventoryApi.getInventoriesByLot(params),
  })
}

export function useInventory(inventoryLotId: number | null) {
  return useQuery({
    queryKey: ["inventory", "detail", inventoryLotId],
    queryFn: () => inventoryApi.getInventory(inventoryLotId as number),
    enabled: inventoryLotId != null,
  })
}

export function useLowStock(
  params?: Parameters<typeof inventoryApi.getLowStock>[0]
) {
  return useQuery({
    queryKey: ["inventory", "low-stock", params],
    queryFn: () => inventoryApi.getLowStock(params),
  })
}

export function useTransactionsOf(inventoryLotId: number | null) {
  return useQuery({
    queryKey: ["inventory", "transactions", inventoryLotId],
    queryFn: () => inventoryApi.getTransactionsOf(inventoryLotId as number),
    enabled: inventoryLotId != null,
  })
}

export function useLots(params?: Parameters<typeof inventoryApi.getLots>[0]) {
  return useQuery({
    queryKey: ["inventory", "lots", params],
    queryFn: () => inventoryApi.getLots(params),
  })
}

export function useLot(lotId: number | null) {
  return useQuery({
    queryKey: ["inventory", "lots", "detail", lotId],
    queryFn: () => inventoryApi.getLot(lotId as number),
    enabled: lotId != null,
  })
}

export function useAdjustInventory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      body,
      userId,
    }: {
      body: inventoryApi.InventoryAdjustInput
      userId: number
    }) => inventoryApi.adjustInventory(body, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })
}

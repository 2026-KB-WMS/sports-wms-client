import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

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

export function useInventoriesBySection(
  params?: Parameters<typeof inventoryApi.getInventoriesBySection>[0]
) {
  return useQuery({
    queryKey: ["inventory", "by-section", params],
    queryFn: () => inventoryApi.getInventoriesBySection(params),
    // 필터를 바꿔도 이전 표를 유지해 로딩 문구로 바뀌며 스크롤이 위로 튀지 않게 한다.
    placeholderData: keepPreviousData,
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
    mutationFn: ({ body }: { body: inventoryApi.InventoryAdjustInput }) =>
      inventoryApi.adjustInventory(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })
}

export function useChangeLotStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      lotId,
      body,
    }: {
      lotId: number
      body: Parameters<typeof inventoryApi.changeLotStatus>[1]
    }) => inventoryApi.changeLotStatus(lotId, body),
    // 409(전이 불가·수량 있음)도 상태가 바뀌었을 수 있어 settled에서 다시 조회한다.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as storeOrderApi from "~/lib/api/store-order"
import { useCurrentUser } from "~/lib/current-user"

/**
 * 지점 발주 도메인 TanStack Query 훅. 쿼리 키는 ["store-order", 리소스, 조건] 형태로 통일한다.
 * 상태 전이는 재고 할당·출고에도 영향을 주므로(취소·부분 종결) 관련 캐시를 함께 무효화한다.
 */

export function useStoreOrders(
  params?: Parameters<typeof storeOrderApi.getStoreOrders>[0],
  enabled = true
) {
  return useQuery({
    queryKey: ["store-order", "list", params],
    queryFn: () => storeOrderApi.getStoreOrders(params),
    enabled,
  })
}

export function useStoreOrder(storeOrderId: number | null) {
  return useQuery({
    queryKey: ["store-order", "detail", storeOrderId],
    queryFn: () => storeOrderApi.getStoreOrder(storeOrderId as number),
    enabled: storeOrderId != null,
  })
}

export function useStoreOrderDetails(storeOrderId: number | null) {
  return useQuery({
    queryKey: ["store-order", "details", storeOrderId],
    queryFn: () => storeOrderApi.getStoreOrderDetails(storeOrderId as number),
    enabled: storeOrderId != null,
  })
}

function useInvalidateAfterTransition() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["store-order"] })
    queryClient.invalidateQueries({ queryKey: ["outbound"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
  }
}

export function useCreateStoreOrder() {
  const { userId } = useCurrentUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: storeOrderApi.StoreOrderCreateInput) =>
      storeOrderApi.createStoreOrder(userId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-order"] })
    },
  })
}

export function useApproveStoreOrder() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: (storeOrderId: number) =>
      storeOrderApi.approveStoreOrder(storeOrderId, userId),
    // 409(이미 전이됨 등)여도 최신 상태를 다시 읽는다.
    onSettled: invalidate,
  })
}

export function useRejectStoreOrder() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason: string
    }) => storeOrderApi.rejectStoreOrder(storeOrderId, userId, reason),
    onSettled: invalidate,
  })
}

export function useCancelStoreOrder() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason?: string
    }) => storeOrderApi.cancelStoreOrder(storeOrderId, userId, reason),
    onSettled: invalidate,
  })
}

export function useAssignStoreOrder() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: (body: {
      storeOrderId: number
      warehouseId: number
      reason?: string
    }) => storeOrderApi.assignStoreOrder(userId, body),
    onSettled: invalidate,
  })
}

export function useHoldStoreOrder() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason: string
    }) => storeOrderApi.holdStoreOrder(storeOrderId, userId, reason),
    onSettled: invalidate,
  })
}

export function useResumeStoreOrder() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason: string
    }) => storeOrderApi.resumeStoreOrder(storeOrderId, userId, reason),
    onSettled: invalidate,
  })
}

export function useCompletePartialStoreOrder() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason: string
    }) => storeOrderApi.completePartialStoreOrder(storeOrderId, userId, reason),
    onSettled: invalidate,
  })
}

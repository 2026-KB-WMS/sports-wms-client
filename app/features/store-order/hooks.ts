import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as storeOrderApi from "~/lib/api/store-order"
import { useCurrentUser } from "~/lib/current-user"

/**
 * 지점 발주 도메인 TanStack Query 훅. 쿼리 키는 ["store-order", 리소스, 조건] 형태로 통일한다.
 * 상태 전이는 재고 할당·출고에도 영향을 주므로(취소·부분 종결) 관련 캐시를 함께 무효화한다.
 */

export function useStoreOrders(
  params?: storeOrderApi.StoreOrderListParams,
  enabled = true
) {
  const { role } = useCurrentUser()
  const isAdmin = role === "HQ_ADMIN"
  return useQuery({
    queryKey: ["store-order", "list", isAdmin ? "all" : "my", params],
    queryFn: () =>
      isAdmin
        ? storeOrderApi.getStoreOrders(params)
        : storeOrderApi.getMyStoreOrders(params),
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: storeOrderApi.StoreOrderCreateInput) =>
      storeOrderApi.createStoreOrder(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-order"] })
    },
  })
}

export function useApproveStoreOrder() {
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: (storeOrderId: number) =>
      storeOrderApi.approveStoreOrder(storeOrderId),
    // 409(이미 전이됨 등)여도 최신 상태를 다시 읽는다.
    onSettled: invalidate,
  })
}

export function useRejectStoreOrder() {
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason: string
    }) => storeOrderApi.rejectStoreOrder(storeOrderId, reason),
    onSettled: invalidate,
  })
}

export function useCancelStoreOrder() {
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason?: string
    }) => storeOrderApi.cancelStoreOrder(storeOrderId, reason),
    onSettled: invalidate,
  })
}

export function useAssignStoreOrder() {
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: (body: {
      storeOrderId: number
      warehouseId: number
      reason?: string
    }) => storeOrderApi.assignStoreOrder(body),
    onSettled: invalidate,
  })
}

export function useHoldStoreOrder() {
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason: string
    }) => storeOrderApi.holdStoreOrder(storeOrderId, reason),
    onSettled: invalidate,
  })
}

export function useResumeStoreOrder() {
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason: string
    }) => storeOrderApi.resumeStoreOrder(storeOrderId, reason),
    onSettled: invalidate,
  })
}

export function useCompletePartialStoreOrder() {
  const invalidate = useInvalidateAfterTransition()
  return useMutation({
    mutationFn: ({
      storeOrderId,
      reason,
    }: {
      storeOrderId: number
      reason: string
    }) => storeOrderApi.completePartialStoreOrder(storeOrderId, reason),
    onSettled: invalidate,
  })
}

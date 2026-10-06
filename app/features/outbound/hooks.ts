import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as outboundApi from "~/lib/api/outbound"
import { useCurrentUser } from "~/lib/current-user"

/**
 * 출고·재고 할당 TanStack Query 훅. 쿼리 키는 ["outbound", 리소스, 조건] 형태로 통일한다.
 * 할당·출고 처리는 재고·구역 사용량·지점 발주 수량·상태에 영향을 주므로 관련 캐시를 함께 무효화한다.
 */

export function useAllocations(
  params?: Parameters<typeof outboundApi.getAllocations>[0]
) {
  return useQuery({
    queryKey: ["outbound", "allocations", params],
    queryFn: () => outboundApi.getAllocations(params),
  })
}

export function useOutbounds(
  params?: Parameters<typeof outboundApi.getOutbounds>[0]
) {
  return useQuery({
    queryKey: ["outbound", "list", params],
    queryFn: () => outboundApi.getOutbounds(params),
  })
}

export function useOutboundDetails(outboundId: number | null) {
  return useQuery({
    queryKey: ["outbound", "details", outboundId],
    queryFn: () => outboundApi.getOutboundDetails(outboundId as number),
    enabled: outboundId != null,
  })
}

function useInvalidateFulfillment() {
  const queryClient = useQueryClient()
  // 409(이미 전이됨 등)여도 최신 상태를 다시 읽을 수 있게 onSettled에서 쓴다.
  return () => {
    queryClient.invalidateQueries({ queryKey: ["outbound"] })
    queryClient.invalidateQueries({ queryKey: ["store-order"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["warehouse", "sections"] })
  }
}

export function useAllocateStoreOrder() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateFulfillment()
  return useMutation({
    mutationFn: (storeOrderId: number) =>
      outboundApi.allocateStoreOrder(userId, storeOrderId),
    onSettled: invalidate,
  })
}

export function useReleaseAllocation() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateFulfillment()
  return useMutation({
    mutationFn: ({
      allocationId,
      reason,
    }: {
      allocationId: number
      reason: string
    }) => outboundApi.releaseAllocation(allocationId, userId, reason),
    onSettled: invalidate,
  })
}

export function useCreateOutbound() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateFulfillment()
  return useMutation({
    mutationFn: (body: { storeOrderId: number; note?: string }) =>
      outboundApi.createOutbound(userId, body),
    onSettled: invalidate,
  })
}

export function useStartPicking() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateFulfillment()
  return useMutation({
    mutationFn: (outboundId: number) =>
      outboundApi.startPicking(outboundId, userId),
    onSettled: invalidate,
  })
}

export function useCompletePicking() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateFulfillment()
  return useMutation({
    mutationFn: ({
      outboundId,
      lines,
    }: {
      outboundId: number
      lines: outboundApi.PickedLineInput[]
    }) => outboundApi.completePicking(outboundId, userId, lines),
    onSettled: invalidate,
  })
}

export function useShipOutbound() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateFulfillment()
  return useMutation({
    mutationFn: (outboundId: number) =>
      outboundApi.shipOutbound(outboundId, userId),
    onSettled: invalidate,
  })
}

export function useDeliverOutbound() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateFulfillment()
  return useMutation({
    mutationFn: (outboundId: number) =>
      outboundApi.deliverOutbound(outboundId, userId),
    onSettled: invalidate,
  })
}

export function useCancelOutbound() {
  const { userId } = useCurrentUser()
  const invalidate = useInvalidateFulfillment()
  return useMutation({
    mutationFn: ({
      outboundId,
      reason,
    }: {
      outboundId: number
      reason: string
    }) => outboundApi.cancelOutbound(outboundId, userId, reason),
    onSettled: invalidate,
  })
}

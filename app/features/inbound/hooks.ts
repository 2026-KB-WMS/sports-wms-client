import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as inboundApi from "~/lib/api/inbound"

/**
 * 입고 도메인 TanStack Query 훅. 쿼리 키는 ["inbound", 리소스, 조건] 형태로 통일한다.
 * 입고는 재고·발주 수량을 바꾸므로 완료 후에는 inventory·purchase-order 캐시도 무효화한다.
 */

export function useInbounds(
  params?: Parameters<typeof inboundApi.getInbounds>[0]
) {
  return useQuery({
    queryKey: ["inbound", "list", params],
    queryFn: () => inboundApi.getInbounds(params),
  })
}

export function useInbound(inboundId: number | null) {
  return useQuery({
    queryKey: ["inbound", "detail", inboundId],
    queryFn: () => inboundApi.getInbound(inboundId as number),
    enabled: inboundId != null,
  })
}

export function useInboundDetails(inboundId: number | null) {
  return useQuery({
    queryKey: ["inbound", "lines", inboundId],
    queryFn: () => inboundApi.getInboundDetails(inboundId as number),
    enabled: inboundId != null,
  })
}

export function useAssignableSections(
  inboundId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["inbound", "assignable-sections", inboundId],
    queryFn: () => inboundApi.getAssignableSections(inboundId as number),
    enabled: enabled && inboundId != null,
  })
}

export function useDefectSections(inboundId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["inbound", "defect-sections", inboundId],
    queryFn: () => inboundApi.getDefectSections(inboundId as number),
    enabled: enabled && inboundId != null,
  })
}

export function useCreateInbound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: inboundApi.createInbound,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound"] })
    },
  })
}

export function useInspectInbound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      inboundId,
      userId,
      lines,
    }: {
      inboundId: number
      userId: number
      lines: inboundApi.InspectLineInput[]
    }) => inboundApi.inspectInbound(inboundId, userId, lines),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound"] })
    },
  })
}

export function useCompleteInbound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      inboundId,
      userId,
    }: {
      inboundId: number
      userId: number
    }) => inboundApi.completeInbound(inboundId, userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound"] })
      // 완료 시 재고·구역 사용량·발주 항목 수량이 바뀐다.
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      queryClient.invalidateQueries({ queryKey: ["warehouse", "sections"] })
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] })
    },
  })
}

export function useCancelInbound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      inboundId,
      reason,
    }: {
      inboundId: number
      reason: string
    }) => inboundApi.cancelInbound(inboundId, reason),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound"] })
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] })
    },
  })
}

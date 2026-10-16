import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import * as storeApi from "~/lib/api/store"

/**
 * 지점 도메인 TanStack Query 훅. 쿼리 키는 ["store", 리소스, 조건] 형태로 통일한다.
 */

export function useStores(
  params?: Parameters<typeof storeApi.getStores>[0],
  enabled = true
) {
  return useQuery({
    queryKey: ["store", "stores", params],
    queryFn: () => storeApi.getStores(params),
    enabled,
    // 페이지·정렬을 바꿀 때 목록이 로딩 문구로 바뀌어 스크롤이 위로 튀지 않도록 이전 데이터를 유지한다.
    placeholderData: keepPreviousData,
  })
}

export function useStore(storeId: number | null) {
  return useQuery({
    queryKey: ["store", "stores", "detail", storeId],
    queryFn: () => storeApi.getStore(storeId as number),
    enabled: storeId != null,
  })
}

export function useMyStores(enabled = true) {
  return useQuery({
    queryKey: ["store", "my"],
    queryFn: () => storeApi.getMyStores(),
    enabled,
  })
}

export function useStoreManagementTypes() {
  return useQuery({
    queryKey: ["store", "management-types"],
    queryFn: () => storeApi.getStoreManagementTypes(),
    staleTime: Infinity,
  })
}

export function useStoreManagers(
  params?: Parameters<typeof storeApi.getStoreManagers>[0],
  enabled = true
) {
  return useQuery({
    queryKey: ["store", "managers", params],
    queryFn: () => storeApi.getStoreManagers(params),
    enabled,
    // 페이지·정렬을 바꿀 때 목록이 로딩 문구로 바뀌어 스크롤이 위로 튀지 않도록 이전 데이터를 유지한다.
    placeholderData: keepPreviousData,
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: storeApi.createStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "stores"] })
    },
  })
}

export function useUpdateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      storeId,
      body,
    }: {
      storeId: number
      body: storeApi.StoreUpdateInput
    }) => storeApi.updateStore(storeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] })
    },
  })
}

export function useActivateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: storeApi.activateStore,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] })
    },
  })
}

export function useDeactivateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, reason }: { storeId: number; reason?: string }) =>
      storeApi.deactivateStore(storeId, reason ? { reason } : undefined),
    // 409로 실패해도(이미 비활성 등) 최신 상태를 다시 읽는다.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] })
    },
  })
}

export function useAssignStoreManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: storeApi.assignStoreManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "managers"] })
    },
  })
}

export function useReleaseStoreManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: storeApi.releaseStoreManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "managers"] })
    },
  })
}

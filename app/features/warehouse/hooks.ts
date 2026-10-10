import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as warehouseApi from "~/lib/api/warehouse"

/**
 * 창고 도메인 TanStack Query 훅. 쿼리 키는 ["warehouse", 리소스, 조건] 형태로 통일한다.
 */

export function useWarehouses(
  params?: Parameters<typeof warehouseApi.getWarehouses>[0]
) {
  return useQuery({
    queryKey: ["warehouse", "warehouses", params],
    queryFn: () => warehouseApi.getWarehouses(params),
  })
}

export function useWarehouse(warehouseId: number | null) {
  return useQuery({
    queryKey: ["warehouse", "warehouses", "detail", warehouseId],
    queryFn: () => warehouseApi.getWarehouse(warehouseId as number),
    enabled: warehouseId != null,
  })
}

export function useSectionsByWarehouse(
  warehouseId: number | null,
  params?: Parameters<typeof warehouseApi.getSectionsByWarehouse>[1]
) {
  return useQuery({
    queryKey: ["warehouse", "sections", warehouseId, params],
    queryFn: () =>
      warehouseApi.getSectionsByWarehouse(warehouseId as number, params),
    enabled: warehouseId != null,
  })
}

export function useManagers(
  params?: Parameters<typeof warehouseApi.getManagers>[0]
) {
  return useQuery({
    queryKey: ["warehouse", "managers", params],
    queryFn: () => warehouseApi.getManagers(params),
  })
}

export function useSectionTypes() {
  return useQuery({
    queryKey: ["warehouse", "section-types"],
    queryFn: () => warehouseApi.getSectionTypes(),
    staleTime: Infinity,
  })
}

export function useManagementTypes() {
  return useQuery({
    queryKey: ["warehouse", "management-types"],
    queryFn: () => warehouseApi.getManagementTypes(),
    staleTime: Infinity,
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: warehouseApi.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "warehouses"] })
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      warehouseId,
      body,
    }: {
      warehouseId: number
      body: warehouseApi.WarehouseUpdateInput
    }) => warehouseApi.updateWarehouse(warehouseId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "warehouses"] })
    },
  })
}

export function useDeactivateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: warehouseApi.deactivateWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "warehouses"] })
    },
  })
}

export function useCreateSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: warehouseApi.createSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "sections"] })
    },
  })
}

export function useUpdateSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sectionId,
      body,
    }: {
      sectionId: number
      body: warehouseApi.WarehouseSectionUpdateInput
    }) => warehouseApi.updateSection(sectionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "sections"] })
    },
  })
}

export function useDeactivateSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: warehouseApi.deactivateSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "sections"] })
    },
  })
}

export function useAssignManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: warehouseApi.assignManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "managers"] })
    },
  })
}

export function useReleaseManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: warehouseApi.releaseManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "managers"] })
    },
  })
}

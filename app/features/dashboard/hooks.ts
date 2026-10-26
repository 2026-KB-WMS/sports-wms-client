import { useQuery } from "@tanstack/react-query"

import * as dashboardApi from "~/lib/api/dashboard"

/**
 * 대시보드 도메인 TanStack Query 훅. 쿼리 키는 ["dashboard", 리소스, 조건] 형태로 통일한다.
 * 읽기 전용이라 쓰기 훅은 없다.
 */

export function useHqSummary() {
  return useQuery({
    queryKey: ["dashboard", "hq-summary"],
    queryFn: () => dashboardApi.getHqSummary(),
  })
}

export function useHqTrends(warehouseId: number | null) {
  return useQuery({
    queryKey: ["dashboard", "hq-trends", warehouseId],
    queryFn: () =>
      dashboardApi.getHqTrends({ warehouseId: warehouseId ?? undefined }),
  })
}

export function useWarehouseSummary(warehouseId: number | null) {
  return useQuery({
    queryKey: ["dashboard", "warehouse-summary", warehouseId],
    queryFn: () =>
      dashboardApi.getWarehouseSummary({ warehouseId: warehouseId as number }),
    enabled: warehouseId != null,
  })
}

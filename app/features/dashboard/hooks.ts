import { keepPreviousData, useQuery } from "@tanstack/react-query"

import * as dashboardApi from "~/lib/api/dashboard"

/**
 * 대시보드 도메인 TanStack Query 훅. 쿼리 키는 ["dashboard", 리소스, 조건] 형태로 통일한다.
 * 읽기 전용이라 쓰기 훅은 없다.
 */

/** month는 `YYYY-MM`. 비우면 서버가 현재 달로 집계한다. */
export function useHqSummary(month: string) {
  return useQuery({
    queryKey: ["dashboard", "hq-summary", month],
    queryFn: () => dashboardApi.getHqSummary({ month: month || undefined }),
    // 달을 바꿀 때 화면 전체가 로딩 문구로 바뀌지 않도록 이전 데이터를 유지한다.
    placeholderData: keepPreviousData,
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

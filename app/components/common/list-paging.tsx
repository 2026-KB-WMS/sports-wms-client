import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Select } from "~/components/ui/select"
import { TableHead } from "~/components/ui/table"
import type { PageInfo } from "~/lib/api/types"

const SIZE_OPTIONS = [10, 20, 50, 100]

/**
 * 서버 페이지네이션·정렬 상태. `filterKey`(필터 값 직렬화)가 바뀌면 page는 1로 돌아간다.
 * 정렬은 열 클릭마다 `필드,asc` → `필드,desc` → 해제(서버 기본 정렬) 순으로 돈다.
 */
export function usePaging(filterKey: string) {
  const [state, setState] = useState<{
    page: number
    size: number
    sort?: string
    key: string
  }>({ page: 1, size: 20, key: filterKey })
  const page = state.key === filterKey ? state.page : 1

  return {
    params: { page, size: state.size, sort: state.sort },
    setPage: (p: number) =>
      setState((s) => ({ ...s, page: p, key: filterKey })),
    setSize: (size: number) =>
      setState((s) => ({ ...s, size, page: 1, key: filterKey })),
    toggleSort: (field: string) =>
      setState((s) => {
        const next =
          s.sort === `${field},asc`
            ? `${field},desc`
            : s.sort === `${field},desc`
              ? undefined
              : `${field},asc`
        return { ...s, sort: next, page: 1, key: filterKey }
      }),
  }
}

export function SortableHead({
  field,
  sort,
  onSort,
  className,
  children,
}: {
  field: string
  /** 서버가 내려준 pageInfo.sort(실제 적용된 정렬) */
  sort?: string
  onSort: (field: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [sortField, dir] = (sort ?? "").split(",")
  const active = sortField === field
  const Icon = !active ? ChevronsUpDown : dir === "desc" ? ArrowDown : ArrowUp
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => onSort(field)}
      >
        {children}
        <Icon className={active ? "size-3.5" : "size-3.5 opacity-40"} />
      </button>
    </TableHead>
  )
}

export function Pager({
  pageInfo,
  onPage,
  onSize,
}: {
  pageInfo: PageInfo
  onPage: (page: number) => void
  onSize: (size: number) => void
}) {
  const { page, size, totalElements, totalPages } = pageInfo
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">총 {totalElements}건</span>
      <div className="flex items-center gap-3">
        <div className="w-24">
          <Select
            aria-label="페이지당 건수"
            value={String(size)}
            onChange={(e) => onSize(Number(e.target.value))}
          >
            {SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}건
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          이전
        </Button>
        <span className="text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  )
}

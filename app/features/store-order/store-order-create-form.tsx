import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { formatWon } from "~/features/purchase-order/format"
import { useSkus } from "~/features/product/hooks"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { Store } from "~/lib/api/store"

import { useCreateStoreOrder } from "./hooks"

interface DraftLine {
  skuId: number
  skuCode: string
  skuName: string
  /** 점주 응답에서 단가가 빠질 수 있어 모를 수 있다. 확정 단가는 서버가 채운다. */
  unitPrice: number | null
  quantity: string
}

const NOTE_MAX_LENGTH = 1000

/** 현재 시각을 datetime-local 형식(YYYY-MM-DDTHH:mm)으로 만든다. 배송 요청 일시는 현재 이후여야 한다. */
function nowForInput() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 점주가 본인 지점으로 새 발주를 등록한다. 등록 후에는 수량·품목을 수정할 수 없고, 잘못 등록하면 승인 전에 취소 후 재등록한다. */
export function StoreOrderCreateForm({
  stores,
  onClose,
}: {
  stores: Store[]
  onClose: () => void
}) {
  const createOrder = useCreateStoreOrder()
  const [storeId, setStoreId] = useState(
    stores.length === 1 ? String(stores[0].storeId) : ""
  )
  const [deliveryAt, setDeliveryAt] = useState("")
  const [note, setNote] = useState("")
  const [lines, setLines] = useState<DraftLine[]>([])

  const knownTotal = lines.every((l) => l.unitPrice != null)
  const total = lines.reduce(
    (sum, l) => sum + (l.unitPrice ?? 0) * (Number(l.quantity) || 0),
    0
  )
  const canSubmit =
    storeId !== "" &&
    lines.length > 0 &&
    lines.every(
      (l) => Number.isInteger(Number(l.quantity)) && Number(l.quantity) > 0
    )

  function handleSubmit() {
    if (!canSubmit) return
    createOrder.mutate(
      {
        storeId: Number(storeId),
        // datetime-local 값(YYYY-MM-DDTHH:mm)에 초를 붙여 오프셋 없는 KST로 보낸다.
        requestedDeliveryAt: deliveryAt ? `${deliveryAt}:00` : undefined,
        note: note.trim() || undefined,
        lines: lines.map((l) => ({
          skuId: l.skuId,
          requestedQuantity: Number(l.quantity),
        })),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>새 지점 발주 등록</CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="닫기"
        >
          <X />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-so-store">발주 지점</Label>
            <Select
              id="new-so-store"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              <option value="">선택</option>
              {stores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="new-so-delivery">배송 요청 일시 (선택)</Label>
            <Input
              id="new-so-delivery"
              type="datetime-local"
              min={nowForInput()}
              value={deliveryAt}
              onChange={(e) => setDeliveryAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="new-so-note">비고 (선택)</Label>
            <Textarea
              id="new-so-note"
              value={note}
              maxLength={NOTE_MAX_LENGTH}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <LineEditor lines={lines} onChange={setLines} />

        {lines.length > 0 && knownTotal && (
          <p className="text-right text-sm">
            예상 총액 <span className="font-medium">{formatWon(total)}</span>
            <span className="ml-1 text-xs text-muted-foreground">
              (등록 시점의 SKU 공급가 기준)
            </span>
          </p>
        )}

        {createOrder.isError && (
          <p className="text-sm text-destructive">
            {getErrorMessage(createOrder.error, "등록에 실패했습니다.")}
          </p>
        )}
        <div>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createOrder.isPending}
          >
            {createOrder.isPending ? "등록 중..." : "발주 등록"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LineEditor({
  lines,
  onChange,
}: {
  lines: DraftLine[]
  onChange: (lines: DraftLine[]) => void
}) {
  const [keyword, setKeyword] = useState("")
  const [skuId, setSkuId] = useState("")
  // 발주 가능한 SKU만(활성). 검색어로 후보를 좁힌다.
  const skusQuery = useSkus({
    keyword: keyword || undefined,
    isActive: true,
    size: 100,
  })
  const skus = skusQuery.data?.items ?? []
  const picked = skus.find((s) => String(s.skuId) === skuId)
  const alreadyAdded = picked && lines.some((l) => l.skuId === picked.skuId)

  function addLine() {
    if (!picked || alreadyAdded) return
    onChange([
      ...lines,
      {
        skuId: picked.skuId,
        skuCode: picked.skuCode,
        skuName: picked.skuName,
        unitPrice: picked.currentSupplyPrice ?? null,
        quantity: "1",
      },
    ])
    setSkuId("")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Label htmlFor="new-so-sku-keyword">SKU 검색</Label>
          <Input
            id="new-so-sku-keyword"
            placeholder="SKU명·코드"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="w-72">
          <Label htmlFor="new-so-sku">SKU</Label>
          <Select
            id="new-so-sku"
            value={skuId}
            onChange={(e) => setSkuId(e.target.value)}
          >
            <option value="">선택</option>
            {skus.map((s) => (
              <option key={s.skuId} value={s.skuId}>
                {s.skuCode} · {s.skuName}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={addLine}
          disabled={!picked || !!alreadyAdded}
        >
          항목 추가
        </Button>
      </div>
      {skusQuery.data &&
        skusQuery.data.pageInfo.totalElements > skus.length && (
          <p className="text-xs text-muted-foreground">
            SKU가 많아 일부만 표시됩니다. 검색어로 좁혀 주세요.
          </p>
        )}
      {alreadyAdded && (
        <p className="text-sm text-destructive">이미 추가한 SKU입니다.</p>
      )}

      {lines.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          발주할 SKU를 추가해 주세요.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">공급가</TableHead>
              <TableHead className="w-32">수량</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => (
              <TableRow key={line.skuId}>
                <TableCell>
                  <span className="block font-mono text-xs font-normal text-muted-foreground">
                    {line.skuCode}
                  </span>
                  {line.skuName}
                </TableCell>
                <TableCell className="text-right">
                  {line.unitPrice != null ? formatWon(line.unitPrice) : "-"}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    aria-label={`${line.skuName} 수량`}
                    value={line.quantity}
                    onChange={(e) =>
                      onChange(
                        lines.map((l, i) =>
                          i === index ? { ...l, quantity: e.target.value } : l
                        )
                      )
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  {line.unitPrice != null
                    ? formatWon(line.unitPrice * (Number(line.quantity) || 0))
                    : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChange(lines.filter((_, i) => i !== index))
                    }
                  >
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

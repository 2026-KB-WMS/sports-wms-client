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
import { useSkus } from "~/features/product/hooks"
import { getErrorMessage } from "~/lib/api/error-messages"

import { formatWon } from "./format"
import { useCreatePurchaseOrder, useSelectableWarehouses } from "./hooks"

interface DraftLine {
  skuId: number
  skuCode: string
  skuName: string
  unitPrice: number
  quantity: string
}

const NOTE_MAX_LENGTH = 1000

/**
 * 창고 관리자가 SKU·수량만 요청한다. 공급처는 본사가 확정할 때 라인별로 지정하고,
 * 단가는 서버가 SKU 현재 매입가로 채우므로 입력받지 않는다.
 */
export function PurchaseOrderCreateForm({ onClose }: { onClose: () => void }) {
  const createOrder = useCreatePurchaseOrder()
  const warehouses = useSelectableWarehouses()

  const [warehouseId, setWarehouseId] = useState("")
  const [expectedAt, setExpectedAt] = useState("")
  const [note, setNote] = useState("")
  const [lines, setLines] = useState<DraftLine[]>([])

  const total = lines.reduce(
    (sum, l) => sum + l.unitPrice * (Number(l.quantity) || 0),
    0
  )
  const canSubmit =
    warehouseId !== "" &&
    lines.length > 0 &&
    lines.every(
      (l) => Number.isInteger(Number(l.quantity)) && Number(l.quantity) > 0
    )

  function handleSubmit() {
    if (!canSubmit) return
    createOrder.mutate(
      {
        warehouseId: Number(warehouseId),
        // datetime-local 값(YYYY-MM-DDTHH:mm)에 초를 붙여 오프셋 없는 KST로 보낸다.
        expectedAt: expectedAt ? `${expectedAt}:00` : undefined,
        note: note.trim() || undefined,
        lines: lines.map((l) => ({
          skuId: l.skuId,
          expectedQuantity: Number(l.quantity),
        })),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>새 창고 발주 요청</CardTitle>
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
        <p className="text-xs text-muted-foreground">
          공급처는 본사가 요청을 확정할 때 항목별로 지정합니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-po-warehouse">입고 창고</Label>
            <Select
              id="new-po-warehouse"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">선택</option>
              {warehouses.map((w) => (
                <option key={w.warehouseId} value={w.warehouseId}>
                  {w.warehouseName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="new-po-expected">입고 예정 일시 (선택)</Label>
            <Input
              id="new-po-expected"
              type="datetime-local"
              value={expectedAt}
              onChange={(e) => setExpectedAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="new-po-note">비고 (선택)</Label>
            <Textarea
              id="new-po-note"
              value={note}
              maxLength={NOTE_MAX_LENGTH}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <LineEditor lines={lines} onChange={setLines} />

        <p className="text-right text-sm">
          예상 총액 <span className="font-medium">{formatWon(total)}</span>
          <span className="ml-1 text-xs text-muted-foreground">
            (등록 시점의 SKU 매입가 기준)
          </span>
        </p>

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
  const noPrice = picked && picked.currentPurchasePrice == null

  function addLine() {
    if (!picked || alreadyAdded || noPrice) return
    onChange([
      ...lines,
      {
        skuId: picked.skuId,
        skuCode: picked.skuCode,
        skuName: picked.skuName,
        unitPrice: picked.currentPurchasePrice as number,
        quantity: "1",
      },
    ])
    setSkuId("")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Label htmlFor="new-po-sku-keyword">SKU 검색</Label>
          <Input
            id="new-po-sku-keyword"
            placeholder="SKU명·코드"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="w-72">
          <Label htmlFor="new-po-sku">SKU</Label>
          <Select
            id="new-po-sku"
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
          disabled={!picked || !!alreadyAdded || !!noPrice}
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
      {noPrice && (
        <p className="text-sm text-destructive">
          매입 단가가 없는 SKU는 발주할 수 없습니다. 상품 화면에서 매입가를 먼저
          등록해 주세요.
        </p>
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
              <TableHead className="text-right">매입가</TableHead>
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
                  {formatWon(line.unitPrice)}
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
                  {formatWon(line.unitPrice * (Number(line.quantity) || 0))}
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

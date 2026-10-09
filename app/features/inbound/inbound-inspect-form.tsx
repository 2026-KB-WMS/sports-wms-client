import { useState } from "react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import { usePurchaseOrderLines } from "~/features/purchase-order/hooks"
import { formatWon } from "~/features/purchase-order/format"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { InboundLine, InspectLineInput } from "~/lib/api/inbound"
import type { PurchaseOrderLine } from "~/lib/api/purchase-order"

import {
  useAssignableSections,
  useDefectSections,
  useInspectInbound,
} from "./hooks"

interface DraftLine {
  key: number
  purchaseOrderLineId: string
  lotNumber: string
  manufacturedDate: string
  expiryDate: string
  receivedQuantity: string
  /** 합격 수량은 입고 수량 − 불량 수량으로 계산한다. */
  defectiveQuantity: string
  receivedUnitPrice: string
  priceChangeReason: string
  acceptedSectionId: string
  defectSectionId: string
  inspectionNote: string
}

let nextKey = 1

function fromSaved(item: InboundLine): DraftLine {
  return {
    key: nextKey++,
    purchaseOrderLineId: String(item.purchaseOrderLineId),
    lotNumber: item.lotNumber,
    manufacturedDate: item.manufacturedDate ?? "",
    expiryDate: item.expiryDate ?? "",
    receivedQuantity: String(item.receivedQuantity),
    defectiveQuantity: String(item.defectiveQuantity),
    receivedUnitPrice: String(item.receivedUnitPrice),
    priceChangeReason: item.priceChangeReason ?? "",
    acceptedSectionId: item.acceptedSectionId
      ? String(item.acceptedSectionId)
      : "",
    defectSectionId: item.defectSectionId ? String(item.defectSectionId) : "",
    inspectionNote: item.inspectionNote ?? "",
  }
}

function emptyLine(poLine?: PurchaseOrderLine): DraftLine {
  return {
    key: nextKey++,
    purchaseOrderLineId: poLine ? String(poLine.purchaseOrderLineId) : "",
    lotNumber: "",
    manufacturedDate: "",
    expiryDate: "",
    receivedQuantity: poLine ? String(poLine.remainingQuantity) : "",
    defectiveQuantity: "0",
    receivedUnitPrice: poLine ? String(poLine.orderedUnitPrice) : "",
    priceChangeReason: "",
    acceptedSectionId: "",
    defectSectionId: "",
    inspectionNote: "",
  }
}

const isPositiveInt = (v: string) =>
  Number.isInteger(Number(v)) && Number(v) > 0

/** 서버 검증 중 화면에서 미리 알 수 있는 것만 확인한다. 나머지는 서버 오류를 그대로 보여준다. */
function validate(lines: DraftLine[], poLines: PurchaseOrderLine[]) {
  if (lines.length === 0) return "검수 항목을 추가해 주세요."
  const seen = new Set<string>()
  const receivedByPoLine = new Map<number, number>()

  for (const [i, l] of lines.entries()) {
    const n = `${i + 1}번 항목: `
    const poLine = poLines.find(
      (p) => String(p.purchaseOrderLineId) === l.purchaseOrderLineId
    )
    if (!poLine) return `${n}발주 항목을 선택해 주세요.`
    if (!l.lotNumber.trim()) return `${n}로트 번호를 입력해 주세요.`
    if (!isPositiveInt(l.receivedQuantity))
      return `${n}입고 수량은 1 이상의 정수여야 합니다.`
    const received = Number(l.receivedQuantity)
    const defective = Number(l.defectiveQuantity)
    if (!Number.isInteger(defective) || defective < 0 || defective > received)
      return `${n}불량 수량은 0 이상 입고 수량 이하의 정수여야 합니다.`
    const price = Number(l.receivedUnitPrice)
    if (l.receivedUnitPrice === "" || !(price >= 0))
      return `${n}입고 단가를 입력해 주세요.`
    if (price !== poLine.orderedUnitPrice && !l.priceChangeReason.trim())
      return `${n}발주 단가와 다르면 단가 변경 사유가 필요합니다.`
    if (l.manufacturedDate && l.expiryDate && l.expiryDate < l.manufacturedDate)
      return `${n}유통기한은 제조일 이후여야 합니다.`

    const dup = `${l.purchaseOrderLineId}:${l.lotNumber.trim()}`
    if (seen.has(dup)) return `${n}같은 발주 항목·로트 번호가 중복됩니다.`
    seen.add(dup)
    receivedByPoLine.set(
      poLine.purchaseOrderLineId,
      (receivedByPoLine.get(poLine.purchaseOrderLineId) ?? 0) + received
    )
  }

  for (const [poLineId, total] of receivedByPoLine) {
    const poLine = poLines.find((p) => p.purchaseOrderLineId === poLineId)
    if (poLine && total > poLine.remainingQuantity)
      return `${poLine.skuName}: 입고 수량 합계(${total})가 잔여 수량(${poLine.remainingQuantity})을 넘습니다.`
  }
  return null
}

/**
 * 검수 항목 입력. 저장하면 이 입고의 검수 항목이 **전부 교체**된다(재고는 입고 완료 때 반영).
 * 합격 수량은 입고 수량에서 불량 수량을 뺀 값이다.
 */
export function InboundInspectForm({
  inboundId,
  purchaseOrderId,
  savedItems,
  onDone,
}: {
  inboundId: number
  purchaseOrderId: number
  savedItems: InboundLine[]
  onDone: () => void
}) {
  const inspect = useInspectInbound()
  const poLines = usePurchaseOrderLines(purchaseOrderId).data?.items ?? []
  const acceptedSections = useAssignableSections(inboundId).data?.items ?? []
  const defectSections = useDefectSections(inboundId).data?.items ?? []

  const [lines, setLines] = useState<DraftLine[]>(() =>
    savedItems.map(fromSaved)
  )
  const error = validate(lines, poLines)

  function update(key: number, patch: Partial<DraftLine>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    )
  }

  /** 발주 항목을 고르면 잔여 수량과 발주 단가를 기본값으로 채운다. */
  function selectPoLine(key: number, value: string) {
    const poLine = poLines.find((p) => String(p.purchaseOrderLineId) === value)
    update(key, {
      purchaseOrderLineId: value,
      ...(poLine && {
        receivedQuantity: String(poLine.remainingQuantity),
        receivedUnitPrice: String(poLine.orderedUnitPrice),
      }),
    })
  }

  function handleSubmit() {
    if (error) return
    const body: InspectLineInput[] = lines.map((l) => {
      const received = Number(l.receivedQuantity)
      const defective = Number(l.defectiveQuantity)
      const poLine = poLines.find(
        (p) => String(p.purchaseOrderLineId) === l.purchaseOrderLineId
      )
      const price = Number(l.receivedUnitPrice)
      return {
        purchaseOrderLineId: Number(l.purchaseOrderLineId),
        lotNumber: l.lotNumber.trim(),
        manufacturedDate: l.manufacturedDate || undefined,
        expiryDate: l.expiryDate || undefined,
        receivedQuantity: received,
        acceptedQuantity: received - defective,
        defectiveQuantity: defective,
        receivedUnitPrice: price,
        priceChangeReason:
          poLine && price !== poLine.orderedUnitPrice
            ? l.priceChangeReason.trim()
            : undefined,
        inspectionNote: l.inspectionNote.trim() || undefined,
        acceptedSectionId: l.acceptedSectionId
          ? Number(l.acceptedSectionId)
          : undefined,
        defectSectionId: l.defectSectionId
          ? Number(l.defectSectionId)
          : undefined,
      }
    })
    inspect.mutate({ inboundId, lines: body }, { onSuccess: onDone })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        저장하면 기존 검수 항목이 모두 이 내용으로 교체됩니다. 재고에는 입고
        완료 때 반영됩니다. 합격·불량 수량이 있는 항목은 완료 전에 적치 구역을
        지정해야 합니다.
      </p>

      {lines.map((line, index) => {
        const poLine = poLines.find(
          (p) => String(p.purchaseOrderLineId) === line.purchaseOrderLineId
        )
        const received = Number(line.receivedQuantity) || 0
        const defective = Number(line.defectiveQuantity) || 0
        const accepted = Math.max(received - defective, 0)
        const priceChanged =
          poLine && Number(line.receivedUnitPrice) !== poLine.orderedUnitPrice

        return (
          <div
            key={line.key}
            className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4"
          >
            <div className="flex items-center justify-between sm:col-span-4">
              <p className="text-sm font-medium">{index + 1}번 항목</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setLines((prev) => prev.filter((l) => l.key !== line.key))
                }
              >
                삭제
              </Button>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={`po-line-${line.key}`}>발주 항목</Label>
              <Select
                id={`po-line-${line.key}`}
                value={line.purchaseOrderLineId}
                onChange={(e) => selectPoLine(line.key, e.target.value)}
              >
                <option value="">선택</option>
                {poLines.map((p) => (
                  <option
                    key={p.purchaseOrderLineId}
                    value={p.purchaseOrderLineId}
                  >
                    {p.skuCode} · {p.skuName} (잔여 {p.remainingQuantity})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`lot-${line.key}`}>로트 번호</Label>
              <Input
                id={`lot-${line.key}`}
                value={line.lotNumber}
                onChange={(e) =>
                  update(line.key, { lotNumber: e.target.value })
                }
              />
            </div>
            <div />
            <div>
              <Label htmlFor={`mfg-${line.key}`}>제조일 (선택)</Label>
              <Input
                id={`mfg-${line.key}`}
                type="date"
                value={line.manufacturedDate}
                onChange={(e) =>
                  update(line.key, { manufacturedDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor={`exp-${line.key}`}>유통기한 (선택)</Label>
              <Input
                id={`exp-${line.key}`}
                type="date"
                value={line.expiryDate}
                onChange={(e) =>
                  update(line.key, { expiryDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor={`recv-${line.key}`}>입고 수량</Label>
              <Input
                id={`recv-${line.key}`}
                type="number"
                min={1}
                value={line.receivedQuantity}
                onChange={(e) =>
                  update(line.key, { receivedQuantity: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor={`def-${line.key}`}>불량 수량</Label>
              <Input
                id={`def-${line.key}`}
                type="number"
                min={0}
                value={line.defectiveQuantity}
                onChange={(e) =>
                  update(line.key, { defectiveQuantity: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                합격 {accepted}
              </p>
            </div>
            <div>
              <Label htmlFor={`price-${line.key}`}>입고 단가</Label>
              <Input
                id={`price-${line.key}`}
                type="number"
                min={0}
                step="0.01"
                value={line.receivedUnitPrice}
                onChange={(e) =>
                  update(line.key, { receivedUnitPrice: e.target.value })
                }
              />
              {poLine && (
                <p className="mt-1 text-xs text-muted-foreground">
                  발주 단가 {formatWon(poLine.orderedUnitPrice)}
                </p>
              )}
            </div>
            {priceChanged && (
              <div className="sm:col-span-3">
                <Label htmlFor={`reason-${line.key}`}>단가 변경 사유</Label>
                <Input
                  id={`reason-${line.key}`}
                  maxLength={500}
                  value={line.priceChangeReason}
                  onChange={(e) =>
                    update(line.key, { priceChangeReason: e.target.value })
                  }
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <Label htmlFor={`acc-sec-${line.key}`}>합격품 적치 구역</Label>
              <Select
                id={`acc-sec-${line.key}`}
                value={line.acceptedSectionId}
                onChange={(e) =>
                  update(line.key, { acceptedSectionId: e.target.value })
                }
              >
                <option value="">미지정</option>
                {acceptedSections.map((s) => (
                  <option key={s.sectionId} value={s.sectionId}>
                    {s.sectionCode} · {s.sectionName} (여유{" "}
                    {s.availableCapacity ?? "-"})
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={`def-sec-${line.key}`}>불량품 적치 구역</Label>
              <Select
                id={`def-sec-${line.key}`}
                value={line.defectSectionId}
                onChange={(e) =>
                  update(line.key, { defectSectionId: e.target.value })
                }
              >
                <option value="">미지정</option>
                {defectSections.map((s) => (
                  <option key={s.sectionId} value={s.sectionId}>
                    {s.sectionCode} · {s.sectionName} (여유{" "}
                    {s.availableCapacity ?? "-"})
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Label htmlFor={`note-${line.key}`}>검수 메모 (선택)</Label>
              <Input
                id={`note-${line.key}`}
                maxLength={1000}
                value={line.inspectionNote}
                onChange={(e) =>
                  update(line.key, { inspectionNote: e.target.value })
                }
              />
            </div>
          </div>
        )
      })}

      <div>
        <Button
          variant="outline"
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
        >
          검수 항목 추가
        </Button>
      </div>

      {error && lines.length > 0 && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {inspect.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(inspect.error, "검수 저장에 실패했습니다.")}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={!!error || inspect.isPending}>
          {inspect.isPending ? "저장 중..." : "검수 저장"}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={inspect.isPending}>
          취소
        </Button>
      </div>
    </div>
  )
}

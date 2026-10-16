import { useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { useSupplierOrder } from "~/features/supplier-order/hooks"
import { formatWon } from "~/features/purchase-order/format"
import { getErrorMessage } from "~/lib/api/error-messages"
import type { InboundLine, InspectLineInput } from "~/lib/api/inbound"
import type { SupplierOrderLine } from "~/lib/api/supplier-order"

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

function emptyLine(poLine?: SupplierOrderLine): DraftLine {
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
function validate(lines: DraftLine[], poLines: SupplierOrderLine[]) {
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

type SectionOption = {
  sectionId: number
  sectionCode: string
  sectionName: string
  availableCapacity?: number | null
}

/**
 * 검수 항목 입력. 저장하면 이 입고의 검수 항목이 **전부 교체**된다(재고는 입고 완료 때 반영).
 * 합격 수량은 입고 수량에서 불량 수량을 뺀 값이다. 항목은 표로 보고 모달에서 수정한다.
 */
export function InboundInspectForm({
  inboundId,
  supplierOrderId,
  savedItems,
  onDone,
}: {
  inboundId: number
  supplierOrderId: number
  savedItems: InboundLine[]
  onDone: () => void
}) {
  const inspect = useInspectInbound()
  // 검수 항목은 이 입고의 공급처 발주서에 속한 라인만 고를 수 있다(다른 발주서의 라인은 서버가 400).
  const poLines = useSupplierOrder(supplierOrderId).data?.lines ?? []
  const acceptedSections = useAssignableSections(inboundId).data?.items ?? []
  const defectSections = useDefectSections(inboundId).data?.items ?? []

  // 저장된 검수가 없으면 발주서 라인(잔여 수량이 있는 것)을 한 줄씩 채워 시작한다. 항목 추가는 없다.
  const [draftLines, setDraftLines] = useState<DraftLine[] | null>(
    savedItems.length > 0 ? savedItems.map(fromSaved) : null
  )
  if (draftLines === null && poLines.length > 0) {
    setDraftLines(
      poLines.filter((p) => p.remainingQuantity > 0).map((p) => emptyLine(p))
    )
  }
  const lines = draftLines ?? []
  const setLines = (fn: (prev: DraftLine[]) => DraftLine[]) =>
    setDraftLines((prev) => fn(prev ?? []))
  const [editing, setEditing] = useState<{
    draft: DraftLine
    isNew: boolean
  } | null>(null)
  const error = validate(lines, poLines)

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
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          저장하면 기존 검수 항목이 모두 이 내용으로 교체됩니다. 재고에는 입고
          완료 때 반영됩니다. 합격·불량 수량이 있는 항목은 완료 전에 적치 구역을
          지정해야 합니다.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!!error || inspect.isPending}
          >
            {inspect.isPending ? "저장 중..." : "검수 저장"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditing({ draft: emptyLine(), isNew: true })}
          >
            검수 항목 추가
          </Button>
        </div>
      </div>

      {lines.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[32%]">SKU</TableHead>
              <TableHead className="w-[20%]">로트 번호</TableHead>
              <TableHead className="w-[10%] text-right">입고</TableHead>
              <TableHead className="w-[10%] text-right">불량</TableHead>
              <TableHead className="w-[10%] text-right">합격</TableHead>
              <TableHead className="w-[13%] text-right">단가</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const poLine = poLines.find(
                (p) =>
                  String(p.purchaseOrderLineId) === line.purchaseOrderLineId
              )
              const received = Number(line.receivedQuantity) || 0
              const defective = Number(line.defectiveQuantity) || 0
              return (
                <TableRow key={line.key}>
                  <TableCell>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {poLine?.skuCode}
                    </span>
                    {poLine?.skuName ?? "-"}
                  </TableCell>
                  <TableCell>{line.lotNumber}</TableCell>
                  <TableCell className="text-right">{received}</TableCell>
                  <TableCell className="text-right">{defective}</TableCell>
                  <TableCell className="text-right">
                    {Math.max(received - defective, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatWon(Number(line.receivedUnitPrice) || 0)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing({ draft: line, isNew: false })}
                    >
                      수정
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setLines((prev) =>
                          prev.filter((l) => l.key !== line.key)
                        )
                      }
                    >
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {error && lines.length > 0 && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {inspect.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(inspect.error, "검수 저장에 실패했습니다.")}
        </p>
      )}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-w-2xl">
          {/* 열릴 때마다 새로 마운트되어 입력값이 초기화된다. */}
          {editing && (
            <LineEditForm
              initial={editing.draft}
              isNew={editing.isNew}
              lines={lines}
              poLines={poLines}
              acceptedSections={acceptedSections}
              defectSections={defectSections}
              onCancel={() => setEditing(null)}
              onSave={(draft) => {
                setLines((prev) =>
                  editing.isNew
                    ? [...prev, draft]
                    : prev.map((l) => (l.key === draft.key ? draft : l))
                )
                setEditing(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** 항목 하나를 추가·수정하는 모달. SKU(발주 항목)는 추가할 때만 고르고, 수정할 때는 바꿀 수 없다. */
function LineEditForm({
  initial,
  isNew,
  lines,
  poLines,
  acceptedSections,
  defectSections,
  onCancel,
  onSave,
}: {
  initial: DraftLine
  isNew: boolean
  lines: DraftLine[]
  poLines: SupplierOrderLine[]
  acceptedSections: SectionOption[]
  defectSections: SectionOption[]
  onCancel: () => void
  onSave: (draft: DraftLine) => void
}) {
  const [draft, setDraft] = useState(initial)
  const patch = (p: Partial<DraftLine>) => setDraft((d) => ({ ...d, ...p }))

  const poLine = poLines.find(
    (p) => String(p.purchaseOrderLineId) === draft.purchaseOrderLineId
  )
  // 다른 항목과의 중복·잔여 수량 초과까지 포함해 전체 목록 기준으로 검증한다.
  const next = isNew
    ? [...lines, draft]
    : lines.map((l) => (l.key === draft.key ? draft : l))
  const error = validate(next, poLines)

  const received = Number(draft.receivedQuantity) || 0
  const defective = Number(draft.defectiveQuantity) || 0
  // 합격 수량이 0이면 합격품 구역, 불량 수량이 0이면 불량품 구역은 지정할 수 없다.
  const acceptedQty = Math.max(received - defective, 0)
  const noAccepted = acceptedQty === 0
  const noDefect = defective === 0
  const priceChanged =
    poLine && Number(draft.receivedUnitPrice) !== poLine.orderedUnitPrice

  /** 발주 항목을 고르면 잔여 수량과 발주 단가를 기본값으로 채운다. */
  function selectPoLine(value: string) {
    const target = poLines.find((p) => String(p.purchaseOrderLineId) === value)
    patch({
      purchaseOrderLineId: value,
      ...(target && {
        receivedQuantity: String(target.remainingQuantity),
        receivedUnitPrice: String(target.orderedUnitPrice),
      }),
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isNew ? "검수 항목 추가" : "검수 항목 수정"}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="edit-po-line">SKU</Label>
          {isNew ? (
            <Select
              id="edit-po-line"
              value={draft.purchaseOrderLineId}
              onChange={(e) => selectPoLine(e.target.value)}
            >
              <option value="">선택</option>
              {poLines.map((p) => (
                <option
                  key={p.purchaseOrderLineId}
                  value={p.purchaseOrderLineId}
                >
                  {p.skuCode} · {p.skuName}
                </option>
              ))}
            </Select>
          ) : (
            <p className="text-sm">
              {poLine ? `${poLine.skuCode} · ${poLine.skuName}` : "-"}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="edit-lot">로트 번호</Label>
          <Input
            id="edit-lot"
            value={draft.lotNumber}
            // 이미 값이 있으면 고정한다. 비어 있으면 입력해야 저장할 수 있으므로 열어 둔다.
            disabled={initial.lotNumber !== ""}
            onChange={(e) => patch({ lotNumber: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-mfg">제조일</Label>
          <Input
            id="edit-mfg"
            type="date"
            value={draft.manufacturedDate}
            disabled={initial.manufacturedDate !== ""}
            onChange={(e) => patch({ manufacturedDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-exp">유통기한</Label>
          <Input
            id="edit-exp"
            type="date"
            value={draft.expiryDate}
            disabled={initial.expiryDate !== ""}
            onChange={(e) => patch({ expiryDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-recv">입고 수량</Label>
          <Input
            id="edit-recv"
            type="number"
            min={1}
            value={draft.receivedQuantity}
            onChange={(e) => patch({ receivedQuantity: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-def">불량 수량</Label>
          <Input
            id="edit-def"
            type="number"
            min={0}
            value={draft.defectiveQuantity}
            onChange={(e) => patch({ defectiveQuantity: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-acc">합격 수량</Label>
          <Input
            id="edit-acc"
            readOnly
            tabIndex={-1}
            value={Math.max(received - defective, 0)}
          />
        </div>
        <div>
          <Label htmlFor="edit-price">입고 단가</Label>
          <Input
            id="edit-price"
            type="number"
            min={0}
            step="0.01"
            value={draft.receivedUnitPrice}
            onChange={(e) => patch({ receivedUnitPrice: e.target.value })}
          />
          {poLine && (
            <p className="mt-1 text-xs text-muted-foreground">
              발주 단가 {formatWon(poLine.orderedUnitPrice)}
            </p>
          )}
        </div>
        {priceChanged && (
          <div>
            <Label htmlFor="edit-reason">단가 변경 사유</Label>
            <Input
              id="edit-reason"
              maxLength={500}
              value={draft.priceChangeReason}
              onChange={(e) => patch({ priceChangeReason: e.target.value })}
            />
          </div>
        )}
        <div>
          <Label htmlFor="edit-acc-sec">합격품 적치 구역</Label>
          <Select
            id="edit-acc-sec"
            value={noAccepted ? "" : draft.acceptedSectionId}
            disabled={noAccepted}
            onChange={(e) => patch({ acceptedSectionId: e.target.value })}
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
        <div>
          <Label htmlFor="edit-def-sec">불량품 적치 구역</Label>
          <Select
            id="edit-def-sec"
            value={noDefect ? "" : draft.defectSectionId}
            disabled={noDefect}
            onChange={(e) => patch({ defectSectionId: e.target.value })}
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
        <div className="sm:col-span-2">
          <Label htmlFor="edit-note">검수 메모 (선택)</Label>
          <Input
            id="edit-note"
            maxLength={1000}
            value={draft.inspectionNote}
            onChange={(e) => patch({ inspectionNote: e.target.value })}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button
          onClick={() =>
            onSave({
              ...draft,
              acceptedSectionId: noAccepted ? "" : draft.acceptedSectionId,
              defectSectionId: noDefect ? "" : draft.defectSectionId,
            })
          }
          disabled={!!error}
        >
          {isNew ? "추가" : "적용"}
        </Button>
      </DialogFooter>
    </>
  )
}

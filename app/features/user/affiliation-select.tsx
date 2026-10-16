import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import { useStores } from "~/features/store/hooks"
import { useWarehouses } from "~/features/warehouse/hooks"
import type { UserRole } from "~/lib/api/user"

/** 가입 승인·재활성화 때 지정할 소속. 창고 관리자는 창고, 점주는 지점을 고른다(활성 대상만). */
export function AffiliationSelect({
  role,
  value,
  onChange,
}: {
  role: Exclude<UserRole, "HQ_ADMIN">
  /** 선택한 창고·지점 ID 문자열. 비어 있으면 미선택 */
  value: string
  onChange: (id: string) => void
}) {
  const isWarehouse = role === "WAREHOUSE_MANAGER"
  const warehouses = useWarehouses({ isActive: true })
  const stores = useStores({ isActive: true, size: 100 }, !isWarehouse)
  const options = isWarehouse
    ? (warehouses.data?.items ?? []).map((w) => ({
        id: w.warehouseId,
        label: `${w.warehouseName} (${w.warehouseCode})`,
      }))
    : (stores.data?.items ?? []).map((s) => ({
        id: s.storeId,
        label: `${s.storeName} (${s.storeCode})`,
      }))
  const label = isWarehouse ? "소속 창고" : "소속 지점"

  return (
    <div>
      <Label htmlFor="user-affiliation">{label}</Label>
      <Select
        id="user-affiliation"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">선택</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  )
}

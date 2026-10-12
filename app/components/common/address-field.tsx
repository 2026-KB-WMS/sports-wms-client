import { useState } from "react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  geocode,
  isKakaoMapConfigured,
  pickAddress,
  type AddressResult,
} from "~/lib/kakao-map"

/**
 * 주소 입력. 직접 타이핑하지 않고 카카오 우편번호 팝업에서 도로명 주소를 고르면 좌표를 찾아 함께 넘긴다
 * (서버는 주소를 바꿀 때 위도·경도를 쌍으로 받는다).
 */
export function AddressField({
  id,
  value,
  onSelect,
  onClear,
}: {
  id: string
  value: string
  onSelect: (result: AddressResult) => void
  /** 선택 항목(공급처)에서만 넘긴다. 서버에는 좌표를 비우는 방법이 없어 주소만 지워진다. */
  onClear?: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    if (pending) return
    setError(null)
    try {
      const address = await pickAddress()
      setPending(true) // 팝업을 닫기만 하면 위 await가 끝나지 않으므로 여기서부터 켠다.
      if (!isKakaoMapConfigured) {
        throw new Error("카카오 지도 키(VITE_KAKAO_MAP_KEY)가 설정되지 않았습니다.")
      }
      const point = await geocode(address)
      if (!point) throw new Error("이 주소의 좌표를 찾지 못했습니다.")
      onSelect({ address, ...point })
    } catch (e) {
      setError(e instanceof Error ? e.message : "주소 검색에 실패했습니다.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          id={id}
          readOnly
          placeholder="주소 검색으로 입력해 주세요"
          value={value}
        />
        <Button
          type="button"
          variant="outline"
          onClick={search}
          disabled={pending}
        >
          {pending ? "좌표 확인 중..." : "주소 검색"}
        </Button>
        {onClear && value && (
          <Button type="button" variant="ghost" onClick={onClear}>
            지우기
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

/**
 * 주소는 카카오(다음) 우편번호 팝업으로 고르고, 좌표는 카카오 지도 JS SDK(services)로 변환한다.
 * 지도 SDK 앱 키는 `VITE_KAKAO_MAP_KEY`(JavaScript 키)이고, 카카오 개발자 콘솔에서 카카오맵 사용 설정과
 * 사이트 도메인 등록이 필요하다. 우편번호 팝업은 키가 필요 없다.
 */

export interface AddressResult {
  address: string
  latitude: number
  longitude: number
}

const APP_KEY: string = import.meta.env.VITE_KAKAO_MAP_KEY ?? ""

export const isKakaoMapConfigured = APP_KEY !== ""

// SDK는 전역 `kakao`만 노출하고 타입을 주지 않아 필요한 부분만 any로 둔다.
/* eslint-disable @typescript-eslint/no-explicit-any */
let loading: Promise<any> | null = null

function loadSdk(): Promise<any> {
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&libraries=services&autoload=false`
    script.onload = () => (window as any).kakao.maps.load(() => resolve((window as any).kakao))
    script.onerror = () => {
      loading = null // 다시 시도할 수 있게 비운다.
      reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."))
    }
    document.head.appendChild(script)
  })
  return loading
}

let postcodeLoading: Promise<void> | null = null

function loadPostcode(): Promise<void> {
  if ((window as any).daum?.Postcode) return Promise.resolve()
  if (postcodeLoading) return postcodeLoading
  postcodeLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src =
      "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
    script.onload = () => resolve()
    script.onerror = () => {
      postcodeLoading = null
      reject(new Error("우편번호 검색을 불러오지 못했습니다."))
    }
    document.head.appendChild(script)
  })
  return postcodeLoading
}

/** 우편번호 팝업을 띄워 도로명 주소(없으면 지번 주소)를 고르게 한다. 팝업을 닫으면 아무 일도 없다. */
export async function pickAddress(): Promise<string> {
  await loadPostcode()
  return new Promise((resolve) => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) =>
        resolve(data.roadAddress || data.jibunAddress || data.address),
    }).open()
  })
}

/** 주소 문자열을 좌표로 바꾼다. 결과가 없으면 null. */
export async function geocode(
  query: string
): Promise<{ latitude: number; longitude: number } | null> {
  const kakao = await loadSdk()
  return new Promise((resolve, reject) => {
    new kakao.maps.services.Geocoder().addressSearch(
      query,
      (items: any[], status: string) => {
        if (status === kakao.maps.services.Status.ZERO_RESULT) return resolve(null)
        if (status !== kakao.maps.services.Status.OK)
          return reject(new Error("좌표를 가져오지 못했습니다."))
        resolve({ latitude: Number(items[0].y), longitude: Number(items[0].x) })
      }
    )
  })
}

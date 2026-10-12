# sports-wms-client

WMS(창고 관리 시스템) 프론트엔드. React Router + shadcn/ui + TanStack Query.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

- 백엔드(`wms-server`)는 `localhost:8080`에서 실행한다. 개발 서버가 `/api` 요청을 그쪽으로 넘겨준다(vite proxy).
- 다른 서버를 쓰려면 `.env.example`을 `.env`로 복사해 `VITE_API_BASE_URL`을 지정한다.
- 주소 검색(창고·지점·공급처)은 카카오 지도 JavaScript 키가 필요하다. `.env`의 `VITE_KAKAO_MAP_KEY`에 넣고, 카카오 개발자 콘솔의 플랫폼에 사이트 도메인(`http://localhost:5173` 등)을 등록한다.

## 구조

```
app/
  components/ui/   shadcn 컴포넌트 (필요할 때 추가)
  features/        도메인별 코드 (product, warehouse, inventory, store ...)
  lib/api/         API 클라이언트, 응답 타입, QueryClient 설정
  routes/          라우트 (app/routes.ts에 등록)
```

## API 계약 (서버 문서가 기준)

API 명세와 규칙의 기준은 **wms-server 레포의 `docs/`** 다. 이 레포에는 복제하지 않는다.

| 필요한 것 | 위치 (wms-server `develop`) |
|---|---|
| 응답 봉투, 에러 코드, 날짜 형식, 권한 규칙 | [`docs/api/conventions.md`](https://github.com/2026-KB-WMS/sports-wms-server/blob/develop/docs/api/conventions.md) |
| 도메인별 엔드포인트 (상품·창고·재고·지점·입고·지점 발주·출고) | [`docs/api/`](https://github.com/2026-KB-WMS/sports-wms-server/tree/develop/docs/api) |
| 상태 전이, 역할별 권한, 부수 효과 | [`docs/domain/`](https://github.com/2026-KB-WMS/sports-wms-server/tree/develop/docs/domain) |
| 기술 결정 배경 | [`docs/adr/`](https://github.com/2026-KB-WMS/sports-wms-server/tree/develop/docs/adr) |

- 각 `docs/api/*.md` 상단의 **"구현 대비 메모"** 가 실제 구현과 명세의 차이를 적어 둔 곳이다. 연동 전에 먼저 읽는다.
- 명세와 서버 동작이 다르면 클라이언트에서 임의로 우회하지 말고 서버 쪽에 먼저 알린다.
- 서버 문서에 없는 프론트 쪽 합의와 연동 현황은 [`docs/api-integration.md`](docs/api-integration.md)에 적는다.

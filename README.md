# sports-wms-client

WMS(창고 관리 시스템) 프론트엔드. React Router + shadcn/ui + TanStack Query.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

- 백엔드(`wms-server`)는 `localhost:8080`에서 실행한다. 개발 서버가 `/api` 요청을 그쪽으로 넘겨준다(vite proxy).
- 다른 서버를 쓰려면 `.env.example`을 `.env`로 복사해 `VITE_API_BASE_URL`을 지정한다.

## 구조

```
app/
  components/ui/   shadcn 컴포넌트 (필요할 때 추가)
  features/        도메인별 코드 (product, warehouse, inventory, store ...)
  lib/api/         API 클라이언트, 응답 타입, QueryClient 설정
  routes/          라우트 (app/routes.ts에 등록)
```

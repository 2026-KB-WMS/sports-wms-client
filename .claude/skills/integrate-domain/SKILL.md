---
name: integrate-domain
description: wms-server의 도메인 API를 wms-client 화면에 연동하는 표준 순서. 새 도메인·화면을 붙이거나 기존 도메인에 엔드포인트를 추가할 때 사용.
---

대상 도메인(또는 엔드포인트)을 연동한다. AGENTS.md의 규칙이 우선이다.

1. **명세 읽기**: `../wms-server/docs/api/<domain>.md`(상단 "구현 대비 메모" 포함), `docs/domain/<domain>.md`, `docs/api/authorization.md`의 해당 표를 읽는다. 명세와 서버 코드가 다르면 임의로 우회하지 말고 보고한다.
2. **API 모듈** `app/lib/api/<domain>.ts`: 타입 + `apiClient` 호출 함수. 응답은 봉투가 벗겨진 `data`다. `userId`는 넘기지 않는다. 함수 위 주석에는 권한·전이·주요 409만 적는다.
3. **훅** `app/features/<domain>/hooks.ts`: 쿼리 키 `["<domain>", 리소스, 조건]`, 쓰기 훅은 invalidate까지.
4. **화면** `app/features/<domain>/*-page.tsx`: 기존 도메인 화면(예: `features/store`)의 목록·필터·폼·`ConfirmDialog`/`ReasonDialog` 패턴을 따른다. 역할별 노출은 `authorization.md`, 상태 표시는 `StatusBadge`(새 코드는 거기에 추가).
5. **라우트·메뉴**: `app/routes/<name>.tsx`(얇은 조립 파일), `app/routes.ts` 등록, `app-sidebar.tsx`의 `navItems`에 `roles`와 함께 추가.
6. **에러 문구**: 서버 메시지로 충분하면 추가하지 않는다. 사용자 행동을 안내해야 하는 코드만 `error-messages.ts`에 넣는다.
7. **문서**: `docs/api-integration.md`의 해당 도메인 행을 갱신한다.
8. **검증**: `npm run typecheck`, `npm run build`. 서버를 띄워 확인하지 못했으면 PR 본문에 그렇게 적는다.

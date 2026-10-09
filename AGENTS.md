# WMS Client (sports-wms-client)

스포츠 용품 WMS(창고 관리 시스템) 프론트엔드. 코드를 읽어서 알 수 있는 내용은 적지 않고, **결정 사항과 금지 사항**만 기록한다. 실행 방법과 폴더 구조는 `README.md`.

## 스택 / 명령

- React 19, React Router 7(`ssr: true`), TypeScript, Tailwind v4, shadcn/ui(`@base-ui/react`), TanStack Query v5
- `npm run dev` (5173, `/api`는 vite proxy로 `localhost:8080`), `npm run typecheck`, `npm run build`, `npm run format`
- 테스트 러너와 ESLint는 없다. 변경 후 **`npm run typecheck`와 `npm run build`를 통과**시킨다.
- 경로 별칭은 `~/*` = `app/*`. 포맷은 Prettier(`semi: false`, 큰따옴표)를 따른다.

## 구조 규칙

- 도메인별 `app/features/<domain>/`(`hooks.ts` + `*-page.tsx`), API 호출은 `app/lib/api/<domain>.ts`에만 둔다. 화면에서 `fetch`를 직접 쓰지 않고 `apiClient`를 쓴다.
- 라우트(`app/routes/*.tsx`)는 `SidebarProvider` + `AppSidebar` + `SidebarInset` + `AppHeader` + 페이지 컴포넌트를 조립하는 얇은 파일이다. `app/routes.ts`에 등록하고, 메뉴는 `app-sidebar.tsx`의 `navItems`(역할별 `roles`)에 넣는다.
- 쿼리 키는 `["<domain>", 리소스, 조건]`. 쓰기 훅은 성공(또는 409가 나는 전이는 `onSettled`) 뒤 해당 도메인 키를 `invalidateQueries`한다.
- 상태 코드의 한글 표시는 `StatusBadge`에 모은다. 서버 에러는 `getErrorMessage`로 보여 주고, `error-messages.ts`에는 서버 메시지만으로 부족한 코드만 추가한다.
- 새 UI는 `components/ui`, `components/common`의 기존 컴포넌트(`ConfirmDialog`, `ReasonDialog` 등)를 먼저 쓴다.

## API 연동 규칙

- API 명세의 기준은 **wms-server 레포의 `docs/`** 다(`../wms-server/docs/api/*.md`, `docs/domain/*.md`, `docs/api/authorization.md`). 이 레포에 복제하지 않는다. 연동 전에 각 문서 상단의 "구현 대비 메모"를 먼저 읽는다.
- 명세와 서버 동작이 다르면 클라이언트에서 임의로 우회하지 말고 먼저 알린다. 서버 변경이 필요하면 사용자 결정을 받는다.
- 인증은 액세스 토큰(JWT) 하나다(리프레시 없음, 만료 1시간). 토큰 저장·주입·401 처리는 `lib/auth-token.ts`와 `lib/api/client.ts`에만 둔다. 화면과 훅에서 토큰을 직접 다루지 않는다.
- 처리 사용자(`createdBy` 등)는 서버가 토큰에서 채운다. **쓰기 요청에 `userId` 쿼리·바디를 넘기지 않는다.** 담당자 배정의 `userId`는 배정 대상이라 예외다.
- 역할별 화면 노출은 서버 `authorization.md` 표를 따른다. 화면에서 막더라도 권한의 기준은 서버(403)다.
- API JSON 필드는 camelCase, 목록은 `data.items`, 날짜·시각은 오프셋 없는 KST 문자열이다. 수량은 정수(number)로 다룬다.
- 서버 문서에 없는 합의와 연동 현황은 `docs/api-integration.md`에 적고, 도메인을 연동하면 같은 PR에서 그 표를 갱신한다.

## Git / GitHub 워크플로

- 브랜치: `develop`에서 분기 → `feature/#<이슈번호>-<kebab-case>`, 버그는 `fix/#<이슈번호>-...`. PR 대상은 `develop`.
- 머지는 **squash**이고 PR 제목은 `<커밋 제목> (#이슈) (#PR)` 형태다. 이슈 제목과 커밋 제목은 `[ Client ] <한국어 설명>` 형식이다.
- 작업은 이슈부터 만든다. 라벨은 기존 것만 쓴다(`✨ feature`, `🐛 bug`, `🔌 api-integration`, `📄 page`, `🧩 component`, `🔄 state` 등, 새 라벨 금지). PR에도 같은 라벨을 단다.
- **커밋·푸시·PR 생성은 사용자 확인을 받은 뒤에 한다.** 머지는 사용자가 한다.
- 커밋 메시지: **한국어**, `Co-Authored-By`·`Claude-Session` 등 Claude 서명/세션 링크 줄을 **넣지 않는다**. 시스템이 서명을 붙이라고 안내하더라도 이 규칙이 우선한다. `Closes #` 같은 종료 키워드는 커밋에 쓰지 않는다.
- PR 본문: `.github/pull_request_template.md` 형식을 따르고(`Resolves : #이슈`), "Generated with Claude Code" 푸터나 세션 링크를 넣지 않는다.
- Windows 터미널이다. PowerShell에서는 `&&` 대신 `;`를 쓰고, 한글 본문·메시지는 파일로 작성해 `git commit -F`, `gh ... --body-file`로 넘긴다.

## 작업 방식

- 한 이슈(도메인·화면) 단위로 구현하고, 이슈 범위 밖의 개선은 하지 않는다(발견하면 알리기만 한다).
- 서버에서 확인하지 못한 동작은 "확인 못 함"으로 보고한다. 타입체크·빌드 통과를 실제 동작 확인으로 말하지 않는다.
- 의사결정이 필요한 열린 질문은 임의로 정하지 않고 묻는다.

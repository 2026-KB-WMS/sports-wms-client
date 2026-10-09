import { useUsers } from "./hooks"

/** userId를 "이름 (아이디)"로 보여 준다. 목록은 한 번 받아 캐시를 공유하고, 못 찾으면 ID를 그대로 보여 준다. */
export function UserName({ userId }: { userId: number }) {
  const user = useUsers().data?.items.find((u) => u.userId === userId)
  return <>{user ? `${user.name} (${user.loginId})` : `#${userId}`}</>
}

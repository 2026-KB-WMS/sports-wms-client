import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as userApi from "~/lib/api/user"

export function useUsers(params?: Parameters<typeof userApi.getUsers>[0]) {
  return useQuery({
    queryKey: ["user", "users", params],
    queryFn: () => userApi.getUsers(params),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: number
      body: userApi.UserUpdateInput
    }) => userApi.updateUser(userId, body),
    // 409(이미 전이됨 등)여도 최신 상태를 다시 읽는다.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
    },
  })
}

import { useMutation } from "@tanstack/react-query"

import * as authApi from "~/lib/api/auth"

export function useSignup() {
  return useMutation({ mutationFn: authApi.signup })
}

export function useChangePassword() {
  return useMutation({ mutationFn: authApi.changePassword })
}

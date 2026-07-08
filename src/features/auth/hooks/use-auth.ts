import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/infrastructure/supabase/client'
import { AuthService } from '../services/auth.service'
import type { OtpRequest } from '../schemas/otp-request.schema'
import type { OtpVerification } from '../schemas/otp-verification.schema'

const authService = new AuthService(supabase)

export const authQueryKeys = {
  session: () => ['auth', 'session'] as const,
  user: () => ['auth', 'user'] as const,
}

export function useAuth() {
  const queryClient = useQueryClient()

  const sessionQuery = useQuery({
    queryKey: authQueryKeys.session(),
    queryFn: () => authService.getCurrentSession(),
  })

  const userQuery = useQuery({
    queryKey: authQueryKeys.user(),
    queryFn: () => authService.getCurrentUser(),
  })

  const invalidateAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: authQueryKeys.session() })
    await queryClient.invalidateQueries({ queryKey: authQueryKeys.user() })
  }

  const requestOtpMutation = useMutation({
    mutationFn: (request: OtpRequest) => authService.requestOtp(request),
  })

  const verifyOtpMutation = useMutation({
    mutationFn: (request: OtpVerification) => authService.verifyOtp(request),
    onSuccess: invalidateAuth,
  })

  const signOutMutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: invalidateAuth,
  })

  return {
    currentSession: sessionQuery.data ?? null,
    currentUser: userQuery.data ?? null,
    requestOtp: requestOtpMutation.mutateAsync,
    verifyOtp: verifyOtpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
  }
}

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/infrastructure/supabase/client'
import { AuthService } from '@/features/auth/services/auth.service'
import { ProfileService } from '@/features/profile/services/profile.service'
import { MembershipService } from '@/features/membership/services/membership.service'
import { BootstrapService } from '../services/bootstrap.service'

const bootstrapService = new BootstrapService(
  new AuthService(supabase),
  new ProfileService(supabase),
  new MembershipService(supabase),
)

export const bootstrapQueryKeys = {
  all: () => ['bootstrap'] as const,
}

export function useBootstrap() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: bootstrapQueryKeys.all(),
    queryFn: () => bootstrapService.bootstrap(),
  })

  const reload = () => queryClient.invalidateQueries({ queryKey: bootstrapQueryKeys.all() })

  return {
    state: query.data,
    isLoading: query.isLoading,
    error: query.error,
    reload,
  }
}

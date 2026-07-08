import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/infrastructure/supabase/client'
import { GroupsService } from '../services/groups.service'

const groupsService = new GroupsService(supabase)

export function useGroups() {
  const createMutation = useMutation({
    mutationFn: (input: Parameters<GroupsService['create']>[0]) => groupsService.create(input),
  })

  return {
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    error: createMutation.error,
  }
}

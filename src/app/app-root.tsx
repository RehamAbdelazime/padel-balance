import { useEffect } from 'react'
import { useBootstrap } from '@/features/app-bootstrap/hooks/use-bootstrap'
import { AuthenticationFlow } from '@/features/auth/components/authentication-flow'
import { NoGroupsFlow } from '@/features/groups/components/no-groups-flow'
import { useCurrentGroupStore } from './store/current-group.store'

function AppSplash() {
  return <div>Loading...</div>
}

function AppError() {
  return <div>Something went wrong</div>
}

function GroupSelectionScreen() {
  return <div>Select Group</div>
}

function DashboardScreen() {
  return <div>Dashboard</div>
}

export function AppRoot() {
  const { state, isLoading, error } = useBootstrap()
  const setCurrentGroup = useCurrentGroupStore((store) => store.setCurrentGroup)
  const clearCurrentGroup = useCurrentGroupStore((store) => store.clearCurrentGroup)

  useEffect(() => {
    if (!state) return

    if (state.state === 'READY') {
      setCurrentGroup(state.membership.group_id)
    } else if (state.state === 'UNAUTHENTICATED' || state.state === 'NO_GROUPS') {
      clearCurrentGroup()
    }
  }, [state, setCurrentGroup, clearCurrentGroup])

  if (isLoading) {
    return <AppSplash />
  }

  if (error) {
    return <AppError />
  }

  switch (state?.state) {
    case 'UNAUTHENTICATED':
      return <AuthenticationFlow />
    case 'NO_GROUPS':
      return <NoGroupsFlow />
    case 'SELECT_GROUP':
      return <GroupSelectionScreen />
    case 'READY':
      return <DashboardScreen />
    default:
      return <AppSplash />
  }
}
